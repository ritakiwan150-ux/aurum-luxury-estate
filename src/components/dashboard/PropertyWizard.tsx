"use client";

import { FormEvent, ReactNode, useState } from "react";
import { ApiNamedItem, ApiProperty } from "../../lib/api";
import { DynamicIcon } from "../ui/icons";
import Select, { SelectOption } from "../ui/Select";
import { useI18n } from "../../i18n/I18nProvider";

export type PropertyBody = Record<string, string | number | number[] | null>;

interface PropertyForm {
  type_id: string;
  city_id: string;
  original_language: "en" | "ar";
  operation: string;
  title: string;
  description: string;
  price: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  district: string;
  latitude: string;
  longitude: string;
}

const emptyForm: PropertyForm = {
  type_id: "",
  city_id: "",
  original_language: "en",
  operation: "sale",
  title: "",
  description: "",
  price: "",
  area: "",
  bedrooms: "",
  bathrooms: "",
  district: "",
  latitude: "25.2048",
  longitude: "55.2708",
};

const STEPS = ["Basics", "Location", "Media", "Review"] as const;
const LAST_STEP = STEPS.length - 1;
const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const inputClass = "w-full rounded border border-white/15 bg-black/20 p-3";
const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: "en", label: "English", icon: "languages" },
  { value: "ar", label: "العربية (Arabic)", icon: "languages" },
];
const OPERATION_OPTIONS: SelectOption[] = [
  { value: "sale", label: "For sale", icon: "tag" },
  { value: "rent", label: "For rent", icon: "key-round" },
];

function formFromProperty(property: ApiProperty): PropertyForm {
  const language = property.original_language === "ar" ? "ar" : "en";
  return {
    type_id: String(property.type_id),
    city_id: String(property.city_id),
    original_language: language,
    operation: property.operation,
    title: (language === "ar" ? property.title_ar : property.title_en) ?? "",
    description:
      (language === "ar" ? property.description_ar : property.description_en) ??
      "",
    price: String(property.price),
    area: String(property.area),
    bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
    bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
    district: property.district ?? "",
    latitude: String(property.latitude ?? ""),
    longitude: String(property.longitude ?? ""),
  };
}

function buildBody(
  form: PropertyForm,
  amenityIds: number[],
  isEditing: boolean,
): PropertyBody {
  const language = form.original_language;
  const body: PropertyBody = {
    type_id: Number(form.type_id),
    city_id: Number(form.city_id),
    [`title_${language}`]: form.title.trim(),
    [`description_${language}`]: form.description.trim(),
    operation: form.operation,
    price: Number(form.price),
    area: Number(form.area),
    bedrooms: form.bedrooms === "" ? null : Number(form.bedrooms),
    bathrooms: form.bathrooms === "" ? null : Number(form.bathrooms),
    district: form.district.trim() || null,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    amenities: amenityIds,
  };
  if (!isEditing) body.original_language = language;
  return body;
}

function Field({
  label,
  className = "",
  group = false,
  children,
}: {
  label: string;
  className?: string;
  group?: boolean;
  children: ReactNode;
}) {
  if (group) {
    return (
      <div
        role="group"
        aria-label={label}
        className={`grid gap-1 text-xs text-brand-muted ${className}`}
      >
        <span>{label}</span>
        {children}
      </div>
    );
  }
  return (
    <label className={`grid gap-1 text-xs text-brand-muted ${className}`}>
      {label}
      {children}
    </label>
  );
}

interface PropertyWizardProps {
  editing: ApiProperty | null;
  propertyTypes: ApiNamedItem[];
  cities: ApiNamedItem[];
  amenities: ApiNamedItem[];
  /** false => the whole form is disabled (e.g. broker license not verified). */
  canSubmit: boolean;
  /** Resolve true when saved, so the wizard can be reset by its parent. */
  onSubmit: (body: PropertyBody, images: File[]) => Promise<boolean>;
  onCancelEdit: () => void;
}

export default function PropertyWizard({
  editing,
  propertyTypes,
  cities,
  amenities,
  canSubmit,
  onSubmit,
  onCancelEdit,
}: PropertyWizardProps) {
  const { t, price } = useI18n();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PropertyForm>(() =>
    editing ? formFromProperty(editing) : emptyForm,
  );
  const [amenityIds, setAmenityIds] = useState<number[]>(
    () => editing?.amenities?.map((item) => item.id) ?? [],
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(editing);
  const update = <K extends keyof PropertyForm>(
    key: K,
    value: PropertyForm[K],
  ) => setForm((current) => ({ ...current, [key]: value }));
  const textDir = form.original_language === "ar" ? "rtl" : "ltr";

  const handleFiles = (files: File[]) => {
    if (files.length > MAX_IMAGES) {
      setFileError(t("You can upload up to {max} images at once.", { max: MAX_IMAGES }));
      return;
    }
    const tooBig = files.find((file) => file.size > MAX_IMAGE_BYTES);
    if (tooBig) {
      setFileError(t("{name} is larger than 5 MB.", { name: tooBig.name }));
      return;
    }
    setFileError("");
    setImageFiles(files);
  };

  const toggleAmenity = (id: number) =>
    setAmenityIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < LAST_STEP) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(buildBody(form, amenityIds, isEditing), imageFiles);
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions: SelectOption[] = propertyTypes.map((type) => ({
    value: String(type.id),
    label: type.name_en,
    icon: type.icon,
  }));
  const cityOptions: SelectOption[] = cities.map((city) => ({
    value: String(city.id),
    label: city.name_en,
    icon: "map-pin",
  }));
  const typeName =
    propertyTypes.find((item) => String(item.id) === form.type_id)?.name_en ??
    "—";
  const cityName =
    cities.find((item) => String(item.id) === form.city_id)?.name_en ?? "—";
  const chosenAmenities = amenities
    .filter((item) => amenityIds.includes(item.id))
    .map((item) => item.name_en);

  return (
    <fieldset disabled={!canSubmit} className="m-0 min-w-0 border-0 p-0">
      <ol className="mb-6 flex flex-wrap gap-2" aria-label={t("Form steps")}>
        {STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? "step" : undefined}
            className={`rounded-full border px-3 py-1 text-xs ${index === step ? "border-brand-gold bg-brand-gold text-brand-obsidian" : index < step ? "border-brand-gold/50 text-brand-gold" : "border-white/15 text-brand-muted"}`}
          >
            {index + 1}. {t(label)}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        {step === 0 && (
          <>
            <Field label={t("Listing language")} group>
              <Select
                disabled={isEditing}
                ariaLabel={t("Listing language")}
                value={form.original_language}
                onChange={(value) =>
                  update("original_language", value === "ar" ? "ar" : "en")
                }
                options={LANGUAGE_OPTIONS}
              />
            </Field>
            <Field label={t("Operation")} group>
              <Select
                ariaLabel={t("Operation")}
                value={form.operation}
                onChange={(value) => update("operation", value)}
                options={OPERATION_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
              />
            </Field>
            <Field label={t("Property type")} group>
              <Select
                required
                ariaLabel={t("Property type")}
                placeholder={t("Select a type")}
                value={form.type_id}
                onChange={(value) => update("type_id", value)}
                options={typeOptions}
              />
            </Field>
            <Field label={t("Title")}>
              <input
                required
                maxLength={255}
                dir={textDir}
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t("Description")} className="md:col-span-2">
              <textarea
                required
                dir={textDir}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                className={`${inputClass} min-h-28`}
              />
            </Field>
            <Field label={t("Price (AED)")}>
              <input
                required
                type="number"
                min={0}
                step="any"
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t("Area (sqft)")}>
              <input
                required
                type="number"
                min={0}
                step="any"
                value={form.area}
                onChange={(event) => update("area", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t("Bedrooms (optional)")}>
              <input
                type="number"
                min={0}
                max={255}
                step={1}
                value={form.bedrooms}
                onChange={(event) => update("bedrooms", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t("Bathrooms (optional)")}>
              <input
                type="number"
                min={0}
                max={255}
                step={1}
                value={form.bathrooms}
                onChange={(event) => update("bathrooms", event.target.value)}
                className={inputClass}
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label={t("City")} group>
              <Select
                required
                ariaLabel={t("City")}
                placeholder={t("Select a city")}
                value={form.city_id}
                onChange={(value) => update("city_id", value)}
                options={cityOptions}
              />
            </Field>
            <Field label={t("District (optional)")}>
              <input
                value={form.district}
                onChange={(event) => update("district", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t("Latitude")}>
              <input
                required
                type="number"
                min={-90}
                max={90}
                step="any"
                value={form.latitude}
                onChange={(event) => update("latitude", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t("Longitude")}>
              <input
                required
                type="number"
                min={-180}
                max={180}
                step="any"
                value={form.longitude}
                onChange={(event) => update("longitude", event.target.value)}
                className={inputClass}
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <div className="md:col-span-2">
              <p className="mb-2 text-xs text-brand-muted">{t("Amenities")}</p>
              {amenities.length === 0 ? (
                <p className="text-sm text-brand-muted">
                  {t("No amenities are available yet.")}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => {
                    const selected = amenityIds.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${selected ? "border-brand-gold bg-brand-gold text-brand-obsidian" : "border-white/20 text-brand-sand hover:border-brand-gold"}`}
                      >
                        <DynamicIcon
                          name={amenity.icon}
                          className="h-3.5 w-3.5"
                        />
                        {amenity.name_en}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {!isEditing ? (
              <div className="md:col-span-2">
                <Field
                  label={t("Images (up to {max}, max 5 MB each). The first one becomes the cover.", { max: MAX_IMAGES })}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      handleFiles(Array.from(event.target.files || []))
                    }
                    className={`${inputClass} text-sm`}
                  />
                </Field>
                {fileError && (
                  <p role="alert" className="mt-2 text-xs text-red-200">
                    {fileError}
                  </p>
                )}
                {imageFiles.length > 0 && (
                  <p className="mt-2 text-xs text-brand-muted">
                    {t("{count} image(s) selected. Uploading can take a few seconds.", { count: imageFiles.length })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-brand-muted md:col-span-2">
                {t("To add or replace photos, use “Upload images” on the listing below.")}
              </p>
            )}
          </>
        )}

        {step === LAST_STEP && (
          <dl className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm md:col-span-2 md:grid-cols-2">
            <div>
              <dt className="text-xs text-brand-muted">{t("Title")}</dt>
              <dd dir={textDir}>{form.title}</dd>
            </div>
            <div>
              <dt className="text-xs text-brand-muted">{t("Type · Operation")}</dt>
              <dd>
                {typeName} ·{" "}
                {form.operation === "rent" ? t("For rent") : t("For sale")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-brand-muted">{t("Price")}</dt>
              <dd>{price(Number(form.price || 0))}</dd>
            </div>
            <div>
              <dt className="text-xs text-brand-muted">
                {t("Area · Beds · Baths")}
              </dt>
              <dd>
                {form.area} sqft · {form.bedrooms || "—"} ·{" "}
                {form.bathrooms || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-brand-muted">{t("Location")}</dt>
              <dd>{[form.district, cityName].filter(Boolean).join(", ")}</dd>
            </div>
            <div>
              <dt className="text-xs text-brand-muted">{t("Amenities")}</dt>
              <dd>
                {chosenAmenities.length ? chosenAmenities.join(", ") : t("None")}
              </dd>
            </div>
            {!isEditing && (
              <div>
                <dt className="text-xs text-brand-muted">{t("Images")}</dt>
                <dd>{imageFiles.length}</dd>
              </div>
            )}
            <p className="text-xs text-brand-muted md:col-span-2">
              {t("Your listing will be reviewed by an administrator before it is published.")}
            </p>
          </dl>
        )}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          {step > 0 && (
            <button
              key="back"
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={submitting}
              className="rounded border border-white/20 px-5 py-3 disabled:opacity-50"
            >
              {t("Back")}
            </button>
          )}
          {step < LAST_STEP ? (
            <button
              key="next"
              type="submit"
              className="rounded bg-brand-gold px-5 py-3 font-bold text-brand-obsidian"
            >
              {t("Next")}
            </button>
          ) : (
            <button
              key="submit"
              type="submit"
              disabled={submitting}
              className="rounded bg-brand-gold px-5 py-3 font-bold text-brand-obsidian disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? isEditing
                  ? t("Saving…")
                  : t("Submitting… uploading images can take a moment")
                : isEditing
                  ? t("Save changes")
                  : t("Submit for review")}
            </button>
          )}
          {isEditing && (
            <button
              key="cancel"
              type="button"
              onClick={onCancelEdit}
              disabled={submitting}
              className="rounded border border-white/20 px-5 py-3 disabled:opacity-50"
            >
              {t("Cancel")}
            </button>
          )}
        </div>
      </form>
    </fieldset>
  );
}
