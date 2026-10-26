"use client";

import { useCallback, useEffect, useState } from "react";
import { ViewType } from "../types";
import {
  ApiInquiry,
  ApiNamedItem,
  ApiProperty,
  ApiUser,
  api,
} from "../lib/api";
import AccountSettings from "./dashboard/AccountSettings";
import AdminOverview from "./dashboard/admin/AdminOverview";
import IconPicker from "./ui/IconPicker";
import Select, { SelectOption } from "./ui/Select";
import ClientAccount from "./dashboard/ClientAccount";
import PropertyWizard, { PropertyBody } from "./dashboard/PropertyWizard";
import { useI18n } from "../i18n/I18nProvider";
import {
  BrokerBadge,
  StatusBadge,
  errorMessage,
  formatDate,
  primaryImageUrl,
} from "./dashboard/shared";

type WorkspaceTab =
  | "overview"
  | "properties"
  | "inquiries"
  | "users"
  | "master-data"
  | "settings"
  | "activity"
  | "account";
type MasterResource = "property-types" | "cities" | "amenities";
type AdminUser = ApiUser & { roles?: Array<{ name: string }> };
type ActivityItem = {
  id: number;
  action: string;
  description?: string;
  created_at?: string;
  admin?: { name: string };
};
type SettingItem = { key: string; value: string | null; group?: string };

const ROLE_OPTIONS: SelectOption[] = [
  { value: "client", label: "Client", icon: "user" },
  { value: "owner", label: "Owner", icon: "briefcase" },
  { value: "admin", label: "Admin", icon: "shield-check" },
];
const MASTER_OPTIONS: SelectOption[] = [
  { value: "property-types", label: "Property types", icon: "building-2" },
  { value: "cities", label: "Cities", icon: "map-pin" },
  { value: "amenities", label: "Amenities", icon: "sparkles" },
];
const INQUIRY_STATUS_OPTIONS: SelectOption[] = [
  { value: "new", label: "New", icon: "sparkles" },
  { value: "contacted", label: "Contacted", icon: "phone" },
  { value: "closed", label: "Closed", icon: "circle-check" },
];

const tabs: Array<{ id: WorkspaceTab; label: string; adminOnly?: boolean }> = [
  { id: "overview", label: "Overview" },
  { id: "properties", label: "Properties" },
  { id: "inquiries", label: "Inquiries" },
  { id: "users", label: "Users", adminOnly: true },
  { id: "master-data", label: "Master data", adminOnly: true },
  { id: "settings", label: "Settings", adminOnly: true },
  { id: "activity", label: "Activity log", adminOnly: true },
  { id: "account", label: "Account" },
];

interface AgentDashboardProps {
  user: ApiUser;
  token: string;
  onRequireAuth: () => void;
  setView: (view: ViewType) => void;
  onUserUpdate?: (user: ApiUser) => void;
}

export default function AgentDashboard({
  user,
  token,
  setView,
  onUserUpdate,
}: AgentDashboardProps) {
  const { t, price } = useI18n();
  const isAdmin = user.roles?.some((role) => role.name === "admin") ?? false;
  const isClient = user.roles?.some((role) => role.name === "client") ?? false;
  const canPublish = user.broker_verification_status === "verified";
  const [tab, setTab] = useState<WorkspaceTab>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingProperties, setPendingProperties] = useState<ApiProperty[]>([]);
  const [publishedProperties, setPublishedProperties] = useState<ApiProperty[]>(
    [],
  );
  const [ownerProperties, setOwnerProperties] = useState<ApiProperty[]>([]);
  const [inquiries, setInquiries] = useState<ApiInquiry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [masterResource, setMasterResource] =
    useState<MasterResource>("property-types");
  const [masterItems, setMasterItems] = useState<ApiNamedItem[]>([]);
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [cities, setCities] = useState<ApiNamedItem[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<ApiNamedItem[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<ApiNamedItem[]>([]);
  const [editingProperty, setEditingProperty] = useState<ApiProperty | null>(
    null,
  );
  const [wizardVersion, setWizardVersion] = useState(0);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [masterForm, setMasterForm] = useState({
    name_ar: "",
    name_en: "",
    icon: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isClient) {
        return;
      } else if (isAdmin) {
        if (tab === "overview") {
          // AdminOverview loads its own analytics.
        } else if (tab === "properties") {
          const [pending, published] = await Promise.all([
            api.adminPendingProperties(token),
            api.properties(),
          ]);
          setPendingProperties(pending.data);
          setPublishedProperties(published.data);
        } else if (tab === "inquiries") {
          setInquiries((await api.adminInquiries(token)).data);
        } else if (tab === "users") {
          setUsers((await api.adminUsers(token)).data);
        } else if (tab === "master-data") {
          const response = await api.adminItems(masterResource, token);
          const key =
            masterResource === "property-types"
              ? "property_types"
              : masterResource;
          setMasterItems((response[key] || []) as ApiNamedItem[]);
        } else if (tab === "settings") {
          setSettings((await api.adminSettings(token)).settings);
        } else if (tab === "activity") {
          setActivity((await api.adminActivityLogs(token)).data);
        }
      } else if (tab === "overview") {
        // Owner overview: listings + inquiries for the stats, and a fresh
        // profile so the license badge reflects the admin's latest decision.
        const [propertiesResponse, inquiriesResponse, me] = await Promise.all([
          api.ownerProperties(token),
          api.ownerInquiries(token),
          api.me(token),
        ]);
        setOwnerProperties(propertiesResponse.properties);
        setInquiries(inquiriesResponse.inquiries);
        onUserUpdate?.(me.user);
      } else if (tab === "properties") {
        const response = await api.ownerProperties(token);
        setOwnerProperties(response.properties);
      } else if (tab === "inquiries") {
        setInquiries((await api.ownerInquiries(token)).inquiries);
      }
    } catch (cause) {
      setError(errorMessage(cause, t("Could not load workspace data.")));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isClient, masterResource, onUserUpdate, t, tab, token]);

  useEffect(() => {
    // Loading updates the pending indicator before awaiting the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isClient) void loadData();
  }, [isClient, loadData]);

  useEffect(() => {
    if (isAdmin || isClient) return;
    Promise.all([api.propertyTypes(), api.cities(), api.amenities()])
      .then(([types, cityList, amenityList]) => {
        setPropertyTypes(types.property_types);
        setCities(cityList.cities);
        setAmenityOptions(
          amenityList.amenities.filter((item) => item.is_active !== false),
        );
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error
            ? cause.message
            : t("Could not load property form options."),
        );
      });
  }, [isAdmin, isClient, t]);

  const perform = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      await loadData();
    } catch (cause) {
      setError(errorMessage(cause, t("The requested change could not be saved.")));
    }
  };

  const submitProperty = async (
    body: PropertyBody,
    images: File[],
  ): Promise<boolean> => {
    setError("");
    setNotice("");
    try {
      if (editingProperty) {
        await api.updateProperty(editingProperty.id, body, token);
        setNotice(
          t("Property updated and sent back for review before publication."),
        );
      } else {
        const { property } = await api.createProperty(body, token);
        if (images.length) {
          try {
            await api.uploadPropertyImages(property.id, images, token);
            setNotice(t("Property submitted for review."));
          } catch (cause) {
            setNotice(
              t("Property submitted, but the images could not be uploaded. Use “Upload images” on the listing to retry."),
            );
            setError(errorMessage(cause, t("Image upload failed.")));
          }
        } else {
          setNotice(t("Property submitted for review."));
        }
      }
      setEditingProperty(null);
      setWizardVersion((version) => version + 1);
      await loadData();
      return true;
    } catch (cause) {
      setError(errorMessage(cause, t("The property could not be saved.")));
      return false;
    }
  };

  const uploadImages = async (property: ApiProperty, files: File[]) => {
    setUploadingId(property.id);
    await perform(
      () => api.uploadPropertyImages(property.id, files, token),
      t("Images uploaded."),
    );
    setUploadingId(null);
  };

  const submitMasterItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data =
      masterResource === "cities"
        ? { name_ar: masterForm.name_ar, name_en: masterForm.name_en }
        : masterForm;
    await perform(
      () => api.adminCreateItem(masterResource, data, token),
      t("Master data item added."),
    );
    setMasterForm({ name_ar: "", name_en: "", icon: "" });
  };

  const visibleTabs = tabs.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="page-surface min-h-screen pb-20 pt-32 text-brand-ivory">
      <div className="container-page space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
              {isClient
                ? t("Client account")
                : isAdmin
                  ? t("Administration workspace")
                  : t("Owner workspace")}
            </p>
            <h1 className="font-serif text-4xl font-bold">
              {t("Welcome,")} {user.name}
            </h1>
          </div>
          <div className="text-sm text-brand-muted">{user.email}</div>
        </header>

        {isClient ? (
          <ClientAccount
            user={user}
            token={token}
            setView={setView}
            onUserUpdate={onUserUpdate}
          />
        ) : (
          <nav className="flex flex-wrap gap-2" aria-label={t("Workspace sections")}>
            {visibleTabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`rounded border px-4 py-2 text-sm ${tab === item.id ? "border-brand-gold bg-brand-gold text-brand-obsidian" : "border-white/15 text-brand-sand hover:border-brand-gold"}`}
              >
                {t(item.label)}
              </button>
            ))}
          </nav>
        )}

        {!isClient && error && (
          <p
            role="alert"
            className="rounded border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200"
          >
            {error}
          </p>
        )}
        {!isClient && notice && (
          <p
            role="status"
            className="rounded border border-green-400/30 bg-green-400/10 p-4 text-sm text-green-100"
          >
            {notice}
          </p>
        )}
        {!isClient && loading && (
          <p role="status" className="text-sm text-brand-muted">
            {t("Loading from Laravel...")}
          </p>
        )}

        {!isClient &&
          tab === "overview" &&
          (isAdmin ? (
            <AdminOverview token={token} onOpenTab={setTab} />
          ) : (
            <OwnerOverview
              user={user}
              properties={ownerProperties}
              inquiries={inquiries}
              onOpenTab={setTab}
            />
          ))}

        {!isClient &&
          tab === "properties" &&
          (isAdmin ? (
            <div className="space-y-8">
              <section className="glass-panel rounded-xl p-6">
                <h2 className="mb-4 font-serif text-2xl">
                  {t("Pending property moderation")}
                </h2>
                {pendingProperties.length === 0 && (
                  <p className="text-sm text-brand-muted">
                    {t("No pending properties.")}
                  </p>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingProperties.map((property) => (
                    <article
                      key={property.id}
                      className="rounded-lg border border-white/10 p-4"
                    >
                      <h3 className="font-bold">
                        {property.title_en || property.title_ar}
                      </h3>
                      <p className="mb-4 text-sm text-brand-muted">
                        {property.city?.name_en} · AED{" "}
                        {Number(property.price).toLocaleString()}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            void perform(
                              () =>
                                api.adminPropertyAction(
                                  property.id,
                                  "approve",
                                  token,
                                ),
                              t("Property published."),
                            )
                          }
                          className="rounded bg-brand-gold px-3 py-2 text-sm font-bold text-brand-obsidian"
                        >
                          {t("Approve")}
                        </button>
                        <button
                          onClick={() => {
                            const rejectionReason = window.prompt(
                              t("Reason for rejection"),
                            );
                            if (rejectionReason?.trim())
                              void perform(
                                () =>
                                  api.adminPropertyAction(
                                    property.id,
                                    "reject",
                                    token,
                                    rejectionReason,
                                  ),
                                t("Property rejected."),
                              );
                          }}
                          className="rounded border border-red-300/40 px-3 py-2 text-sm text-red-200"
                        >
                          {t("Reject")}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
              <section className="glass-panel rounded-xl p-6">
                <h2 className="mb-4 font-serif text-2xl">{t("Published listings")}</h2>
                <div className="space-y-3">
                  {publishedProperties.map((property) => (
                    <div
                      key={property.id}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 py-3"
                    >
                      <span>
                        {property.title_en || property.title_ar} ·{" "}
                        {property.city?.name_en}
                      </span>
                      <button
                        onClick={() =>
                          void perform(
                            () =>
                              api.adminPropertyAction(
                                property.id,
                                "toggle-featured",
                                token,
                              ),
                            t("Featured status updated."),
                          )
                        }
                        className="rounded border border-brand-gold/40 px-3 py-2 text-xs text-brand-gold"
                      >
                        {property.is_featured
                          ? t("Remove featured")
                          : t("Mark featured")}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-8">
              <LicenseBanner user={user} />
              <section
                id="property-form"
                className="glass-panel scroll-mt-32 rounded-xl p-6"
              >
                <h2 className="mb-2 font-serif text-2xl">
                  {editingProperty ? t("Edit property") : t("Submit a property")}
                </h2>
                {!canPublish && !editingProperty && (
                  <p className="mb-5 text-sm text-brand-muted">
                    {t("Submitting new properties is disabled until your broker license is verified.")}
                  </p>
                )}
                <PropertyWizard
                  key={`${editingProperty?.id ?? "new"}-${wizardVersion}`}
                  editing={editingProperty}
                  propertyTypes={propertyTypes}
                  cities={cities}
                  amenities={amenityOptions}
                  canSubmit={canPublish || Boolean(editingProperty)}
                  onSubmit={submitProperty}
                  onCancelEdit={() => setEditingProperty(null)}
                />
              </section>

              <section className="glass-panel rounded-xl p-6">
                <h3 className="mb-3 font-serif text-xl">{t("Your listings")}</h3>
                <div>
                  {ownerProperties.map((property) => {
                    const image = primaryImageUrl(property);
                    const title =
                      property.title_en ||
                      property.title_ar ||
                      t("Untitled property");
                    return (
                      <article
                        key={property.id}
                        className="flex flex-wrap gap-4 border-b border-white/10 py-4"
                      >
                        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-black/30">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={image}
                              alt={title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-brand-muted">
                              {t("No image")}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">{title}</p>
                            <StatusBadge status={property.status} />
                          </div>
                          <p className="text-sm text-brand-muted">
                            {price(property.price)} ·{" "}
                            {property.operation === "rent"
                              ? t("For rent")
                              : t("For sale")}{" "}
                            · {property.city?.name_en}
                          </p>
                          <p className="text-xs text-brand-muted">
                            {property.views_count ?? 0} {t("views")}
                          </p>
                          {property.status === "rejected" && (
                            <p className="mt-2 rounded border border-red-400/30 bg-red-400/10 p-3 text-xs text-red-200">
                              <span className="font-bold">
                                {t("Rejection reason:")}{" "}
                              </span>
                              {property.rejection_reason ||
                                t("No reason was provided.")}{" "}
                              {t("Edit the listing and save it to send it back for review.")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-start gap-2">
                          <label
                            className={`cursor-pointer rounded border border-white/15 px-3 py-2 text-xs ${uploadingId === property.id ? "pointer-events-none opacity-60" : ""}`}
                          >
                            {uploadingId === property.id
                              ? t("Uploading…")
                              : t("Upload images")}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(event) => {
                                const files = Array.from(
                                  event.target.files || [],
                                );
                                event.target.value = "";
                                if (files.length)
                                  void uploadImages(property, files);
                              }}
                            />
                          </label>
                          <button
                            onClick={() => {
                              setEditingProperty(property);
                              setWizardVersion((version) => version + 1);
                              document
                                .getElementById("property-form")
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                            }}
                            className="rounded border border-brand-gold/40 px-3 py-2 text-xs text-brand-gold"
                          >
                            {t("Edit")}
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(t("Delete this property?")))
                                void perform(
                                  () => api.deleteProperty(property.id, token),
                                  t("Property deleted."),
                                );
                            }}
                            className="rounded border border-red-300/30 px-3 py-2 text-xs text-red-200"
                          >
                            {t("Delete")}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  {ownerProperties.length === 0 && (
                    <p className="text-sm text-brand-muted">
                      {t("No property submissions yet.")}
                    </p>
                  )}
                </div>
              </section>
            </div>
          ))}

        {!isClient && tab === "inquiries" && (
          <section className="glass-panel rounded-xl p-6">
            <h2 className="mb-4 font-serif text-2xl">
              {isAdmin ? t("All inquiries") : t("Inquiries for your listings")}
            </h2>
            {isAdmin ? (
              <InquiryTable
                inquiries={inquiries}
                onStatusChange={(item, status) =>
                  void perform(
                    () => api.adminUpdateInquiry(item.id, status, token),
                    t("Inquiry status updated."),
                  )
                }
              />
            ) : (
              <InquiryTable inquiries={inquiries} />
            )}
          </section>
        )}

        {isAdmin && tab === "users" && (
          <section className="glass-panel rounded-xl p-6">
            <h2 className="mb-4 font-serif text-2xl">{t("User management")}</h2>
            <div className="space-y-3">
              {users.map((managedUser) => {
                const isSelf = managedUser.id === user.id;
                const hasLicense = Boolean(managedUser.broker_license_number);
                const brokerStatus = managedUser.broker_verification_status;
                return (
                  <article
                    key={managedUser.id}
                    className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-3"
                  >
                    <div>
                      <p className="font-bold">
                        {managedUser.name}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-brand-muted">
                            {t("(you)")}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-brand-muted">
                        {managedUser.email} ·{" "}
                        {managedUser.roles?.map((role) => role.name).join(", ")}
                      </p>
                      {hasLicense && (
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                          {t("License {number}", { number: managedUser.broker_license_number ?? "" })}{" "}
                          <BrokerBadge status={brokerStatus} />
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select
                        size="sm"
                        disabled={isSelf}
                        ariaLabel={t("Role for {name}", { name: managedUser.name })}
                        value={managedUser.roles?.[0]?.name || "client"}
                        onChange={(role) =>
                          void perform(
                            () =>
                              api.adminUserAction(
                                managedUser.id,
                                "assign-role",
                                token,
                                { role },
                              ),
                            t("User role updated."),
                          )
                        }
                        options={ROLE_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
                        className="w-36"
                      />
                      {!isSelf && (
                        <button
                          onClick={() =>
                            void perform(
                              () =>
                                api.adminUserAction(
                                  managedUser.id,
                                  "toggle-status",
                                  token,
                                ),
                              t("User status changed."),
                            )
                          }
                          className="rounded border border-white/15 px-3 py-2 text-xs"
                        >
                          {managedUser.is_active === false
                            ? t("Activate")
                            : t("Deactivate")}
                        </button>
                      )}
                      {hasLicense && brokerStatus !== "verified" && (
                        <button
                          onClick={() =>
                            void perform(
                              () =>
                                api.adminUserAction(
                                  managedUser.id,
                                  "verify-broker",
                                  token,
                                ),
                              t("Broker verified."),
                            )
                          }
                          className="rounded border border-brand-gold/40 px-3 py-2 text-xs text-brand-gold"
                        >
                          {t("Verify broker")}
                        </button>
                      )}
                      {hasLicense && brokerStatus !== "rejected" && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                t("Reject the broker license of {name}?", { name: managedUser.name }),
                              )
                            )
                              void perform(
                                () =>
                                  api.adminUserAction(
                                    managedUser.id,
                                    "reject-broker",
                                    token,
                                  ),
                                t("Broker license rejected."),
                              );
                          }}
                          className="rounded border border-red-300/30 px-3 py-2 text-xs text-red-200"
                        >
                          {t("Reject broker")}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {isAdmin && tab === "master-data" && (
          <section className="glass-panel rounded-xl p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-serif text-2xl">{t("Master data")}</h2>
              <Select
                ariaLabel={t("Master data type")}
                value={masterResource}
                onChange={(value) => setMasterResource(value as MasterResource)}
                options={MASTER_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
                className="w-56"
              />
            </div>
            <form
              onSubmit={submitMasterItem}
              className="mb-6 flex flex-wrap gap-3"
            >
              <input
                required
                placeholder={t("Name (Arabic)")}
                value={masterForm.name_ar}
                onChange={(event) =>
                  setMasterForm({ ...masterForm, name_ar: event.target.value })
                }
                className="rounded border border-white/15 bg-black/20 p-3"
              />
              <input
                required
                placeholder={t("Name (English)")}
                value={masterForm.name_en}
                onChange={(event) =>
                  setMasterForm({ ...masterForm, name_en: event.target.value })
                }
                className="rounded border border-white/15 bg-black/20 p-3"
              />
              {masterResource !== "cities" && (
                <IconPicker
                  ariaLabel={t("Icon")}
                  value={masterForm.icon}
                  onChange={(icon) => setMasterForm({ ...masterForm, icon })}
                  className="min-w-[11rem]"
                />
              )}
              <button className="rounded bg-brand-gold px-4 py-3 font-bold text-brand-obsidian">
                {t("Add")}
              </button>
            </form>
            <div className="space-y-3">
              {masterItems.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 border-b border-white/10 py-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <input
                    aria-label={t("English name for {name}", { name: item.name_en })}
                    value={item.name_en}
                    onChange={(event) =>
                      setMasterItems((items) =>
                        items.map((current) =>
                          current.id === item.id
                            ? { ...current, name_en: event.target.value }
                            : current,
                        ),
                      )
                    }
                    className="rounded border border-white/15 bg-black/20 p-2"
                  />
                  <input
                    aria-label={t("Arabic name for {name}", { name: item.name_en })}
                    value={item.name_ar}
                    onChange={(event) =>
                      setMasterItems((items) =>
                        items.map((current) =>
                          current.id === item.id
                            ? { ...current, name_ar: event.target.value }
                            : current,
                        ),
                      )
                    }
                    className="rounded border border-white/15 bg-black/20 p-2"
                  />
                  {masterResource !== "cities" ? (
                    <IconPicker
                      ariaLabel={t("Icon for {name}", { name: item.name_en })}
                      value={item.icon || ""}
                      onChange={(icon) =>
                        setMasterItems((items) =>
                          items.map((current) =>
                            current.id === item.id
                              ? { ...current, icon }
                              : current,
                          ),
                        )
                      }
                    />
                  ) : (
                    <span />
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const data: Record<string, string | boolean> = {
                          name_ar: item.name_ar,
                          name_en: item.name_en,
                        };
                        if (masterResource !== "cities")
                          data.icon = item.icon || "";
                        void perform(
                          () =>
                            api.adminUpdateItem(
                              masterResource,
                              item.id,
                              data,
                              token,
                            ),
                          t("Master data item updated."),
                        );
                      }}
                      className="rounded border border-brand-gold/40 px-3 py-2 text-xs text-brand-gold"
                    >
                      {t("Save")}
                    </button>
                    {item.is_active !== undefined && (
                      <button
                        onClick={() =>
                          void perform(
                            () =>
                              api.adminUpdateItem(
                                masterResource,
                                item.id,
                                { is_active: !item.is_active },
                                token,
                              ),
                            t("Status updated."),
                          )
                        }
                        className="rounded border border-white/15 px-3 py-2 text-xs"
                      >
                        {item.is_active ? t("Deactivate") : t("Activate")}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(t("Delete {name}?", { name: item.name_en })))
                          void perform(
                            () =>
                              api.adminDeleteItem(
                                masterResource,
                                item.id,
                                token,
                              ),
                            t("Item deleted."),
                          );
                      }}
                      className="rounded border border-red-300/30 px-3 py-2 text-xs text-red-200"
                    >
                      {t("Delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {isAdmin && tab === "settings" && (
          <section className="glass-panel rounded-xl p-6">
            <h2 className="mb-4 font-serif text-2xl">{t("Application settings")}</h2>
            <div className="space-y-3">
              {settings.map((setting) => (
                <label
                  key={setting.key}
                  className="grid gap-2 text-sm md:grid-cols-[1fr_2fr]"
                >
                  <span className="text-brand-sand">{setting.key}</span>
                  <input
                    value={setting.value || ""}
                    onChange={(event) =>
                      setSettings((current) =>
                        current.map((item) =>
                          item.key === setting.key
                            ? { ...item, value: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="rounded border border-white/15 bg-black/20 p-3"
                  />
                </label>
              ))}
              <button
                onClick={() =>
                  void perform(
                    () =>
                      api.adminUpdateSettings(
                        settings.map(({ key, value }) => ({
                          key,
                          value: value || "",
                        })),
                        token,
                      ),
                    t("Settings saved."),
                  )
                }
                className="mt-3 rounded bg-brand-gold px-5 py-3 font-bold text-brand-obsidian"
              >
                {t("Save settings")}
              </button>
            </div>
          </section>
        )}

        {isAdmin && tab === "activity" && (
          <section className="glass-panel rounded-xl p-6">
            <h2 className="mb-4 font-serif text-2xl">{t("Recent activity")}</h2>
            <div className="space-y-3">
              {activity.map((entry) => (
                <article
                  key={entry.id}
                  className="border-b border-white/10 py-3"
                >
                  <p className="font-bold">{entry.action}</p>
                  <p className="text-sm text-brand-muted">
                    {entry.description}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {entry.admin?.name} · {entry.created_at}
                  </p>
                </article>
              ))}
              {activity.length === 0 && (
                <p className="text-sm text-brand-muted">
                  {t("No activity recorded.")}
                </p>
              )}
            </div>
          </section>
        )}
        {!isClient && tab === "account" && (
          <AccountSettings
            user={user}
            token={token}
            onUserUpdate={onUserUpdate}
          />
        )}
      </div>
    </div>
  );
}

function LicenseBanner({ user }: { user: ApiUser }) {
  const { t } = useI18n();
  const status = user.broker_verification_status ?? "not_applicable";
  const config: Record<
    string,
    { title: string; text: string; classes: string }
  > = {
    verified: {
      title: t("Broker license verified"),
      text: t("License {number} is verified. You can submit properties for review.", { number: user.broker_license_number ?? "" }),
      classes: "border-green-400/40 bg-green-400/10 text-green-100",
    },
    pending: {
      title: t("License under review"),
      text: t("Your license is under review. You will be able to publish properties once an administrator approves it."),
      classes: "border-brand-gold/50 bg-brand-gold/10 text-brand-ivory",
    },
    rejected: {
      title: t("License rejected"),
      text: t("Your broker license was rejected. Please contact support to resolve this before publishing properties."),
      classes: "border-red-400/40 bg-red-400/10 text-red-100",
    },
    not_applicable: {
      title: t("No broker license on file"),
      text: t("A verified broker license is required to publish properties. Please contact support to add yours."),
      classes: "border-white/20 bg-white/5 text-brand-ivory",
    },
  };
  const current = config[status] ?? config.not_applicable;
  return (
    <section
      role="status"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-5 ${current.classes}`}
    >
      <div>
        <p className="font-serif text-xl">{current.title}</p>
        <p className="mt-1 text-sm opacity-90">{current.text}</p>
      </div>
      <BrokerBadge status={status} />
    </section>
  );
}

function OwnerOverview({
  user,
  properties,
  inquiries,
  onOpenTab,
}: {
  user: ApiUser;
  properties: ApiProperty[];
  inquiries: ApiInquiry[];
  onOpenTab: (tab: WorkspaceTab) => void;
}) {
  const { t } = useI18n();
  const count = (status: string) =>
    properties.filter((property) => property.status === status).length;
  const totalViews = properties.reduce(
    (sum, property) => sum + (property.views_count ?? 0),
    0,
  );
  const cards: Array<[string, number]> = [
    [t("My listings"), properties.length],
    [t("Published"), count("published")],
    [t("Pending review"), count("pending")],
    [t("Rejected"), count("rejected")],
    [t("Total views"), totalViews],
    [
      t("New inquiries"),
      inquiries.filter((inquiry) => inquiry.status === "new").length,
    ],
  ];
  return (
    <div className="space-y-6">
      <LicenseBanner user={user} />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <article key={label} className="glass-panel rounded-xl p-6">
            <p className="text-xs uppercase tracking-widest text-brand-muted">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold text-brand-gold">{value}</p>
          </article>
        ))}
      </section>
      <section className="glass-panel rounded-xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl">{t("Latest inquiries")}</h2>
            <p className="text-sm text-brand-muted">
              {t("Requests sent to your property listings.")}
            </p>
          </div>
          {inquiries.length > 5 && (
            <button
              onClick={() => onOpenTab("inquiries")}
              className="rounded border border-brand-gold/40 px-3 py-2 text-xs text-brand-gold"
            >
              {t("View all")}
            </button>
          )}
        </div>
        <InquiryTable inquiries={inquiries.slice(0, 5)} />
      </section>
    </div>
  );
}

function InquiryTable({
  inquiries,
  onStatusChange,
}: {
  inquiries: ApiInquiry[];
  onStatusChange?: (inquiry: ApiInquiry, status: ApiInquiry["status"]) => void;
}) {
  const { t, lang } = useI18n();
  if (!inquiries.length)
    return <p className="text-sm text-brand-muted">{t("No inquiries found.")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-brand-muted">
          <tr>
            <th className="p-3">{t("Client")}</th>
            <th className="p-3">{t("Property")}</th>
            <th className="p-3">{t("Contact")}</th>
            <th className="p-3">{t("Message")}</th>
            <th className="p-3">{t("Date")}</th>
            <th className="p-3">{t("Status")}</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inquiry) => (
            <tr key={inquiry.id} className="border-t border-white/10 align-top">
              <td className="p-3">{inquiry.name}</td>
              <td className="p-3">
                {inquiry.property?.title_en ||
                  inquiry.property?.title_ar ||
                  inquiry.property_id}
              </td>
              <td className="p-3">
                <a
                  href={`tel:${inquiry.phone.replace(/[^\d+]/g, "")}`}
                  className="text-brand-gold hover:underline"
                >
                  {inquiry.phone}
                </a>
              </td>
              <td className="max-w-sm whitespace-pre-wrap p-3">
                {inquiry.message}
              </td>
              <td className="whitespace-nowrap p-3">
                {formatDate(inquiry.created_at, lang)}
              </td>
              <td className="p-3">
                {onStatusChange ? (
                  <Select
                    size="sm"
                    ariaLabel={t("Status of inquiry {id}", { id: inquiry.id })}
                    value={inquiry.status}
                    onChange={(status) =>
                      onStatusChange(inquiry, status as ApiInquiry["status"])
                    }
                    options={INQUIRY_STATUS_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
                    className="w-36"
                  />
                ) : (
                  <span className="capitalize">{inquiry.status}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
