"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, Mail, MapPin, Phone } from "lucide-react";
import { ApiProperty, api } from "../lib/api";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../providers/AuthProvider";
import Select, { type SelectOption } from "./ui/Select";

const TOTAL_STEPS = 4;
const inputClass = "w-full border-b-2 border-white/20 bg-transparent py-3 text-2xl text-brand-ivory placeholder:text-brand-sand/30 focus:border-brand-gold focus:outline-none md:text-3xl";

export default function ConciergeForm() {
  const { dict, text, pick, dir } = useI18n();
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const c = dict.concierge;

  const [step, setStep] = useState(1);
  const [typedName, setTypedName] = useState<string | null>(null);
  const name = typedName ?? user?.name ?? "";
  const [phone, setPhone] = useState("");
  const [propertyId, setPropertyId] = useState(searchParams.get("property") ?? "");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contact, setContact] = useState<{ phone?: string; email?: string }>({});

  useEffect(() => {
    let active = true;
    api.properties()
      .then((response) => active && setProperties(response.data))
      .catch(() => active && setLoadFailed(true));
    api.publicSettings()
      .then(({ settings }) => active && setContact({ phone: settings.contact_phone ?? undefined, email: settings.contact_email ?? undefined }))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const propertyOptions: SelectOption[] = properties.map((property) => ({
    value: String(property.id),
    label: pick(property, "title") || `#${property.id}`,
    icon: "building-2",
  }));

  const isValid = (current: number) => {
    if (current === 1) return name.trim().length > 1;
    if (current === 2) return phone.replace(/\D/g, "").length >= 7;
    if (current === 3) return propertyId !== "";
    return true;
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid(step)) return;
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const chosen = properties.find((property) => String(property.id) === propertyId);
      const intro = chosen ? text(c.interested, { title: pick(chosen, "title") }) : "";
      const dateNote = date ? text(c.dateNote, { date }) : "";
      await api.submitInquiry(
        Number(propertyId),
        {
          name: name.trim(),
          phone: phone.trim(),
          message: [intro, message.trim(), dateNote].filter(Boolean).join("\n") || c.defaultMessage,
        },
        token,
      );
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : dict.detail.sendError);
    } finally {
      setSubmitting(false);
    }
  }

  const reset = () => {
    setSubmitted(false);
    setStep(1);
    setPhone("");
    setMessage("");
    setDate("");
  };

  const slide = dir === "rtl" ? -20 : 20;
  const heading = [c.stepName, c.stepPhone, c.stepProperty, c.stepMessage][step - 1];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden page-surface px-6 pb-20 pt-32 md:px-16">
      <div className="z-10 w-full max-w-4xl space-y-14">
        <header className="space-y-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-gold">{c.eyebrow}</p>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-brand-ivory md:text-6xl">{c.title}</h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-brand-sand md:text-base">{c.subtitle}</p>
        </header>

        <div className="glass-panel relative overflow-hidden rounded-2xl p-8 shadow-2xl md:p-16">
          <div className="absolute inset-x-0 top-0 h-1 bg-white/5" aria-hidden="true">
            <div className="h-full bg-brand-gold transition-all duration-500" style={{ width: `${submitted ? 100 : (step / TOTAL_STEPS) * 100}%` }} />
          </div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 py-8 text-center">
                <CheckCircle className="mx-auto h-14 w-14 text-brand-gold" aria-hidden="true" />
                <h2 className="font-serif text-3xl font-bold text-brand-ivory">{c.successTitle}</h2>
                <p className="mx-auto max-w-md text-brand-sand" role="status">{c.successText}</p>
                <button type="button" onClick={reset} className="mt-4 rounded border border-brand-gold/40 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-gold hover:bg-brand-gold/10">
                  {c.again}
                </button>
              </motion.div>
            ) : (
              <motion.form key={step} onSubmit={handleSubmit} initial={{ opacity: 0, x: slide }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -slide }} transition={{ duration: 0.35 }} className="space-y-8">
                <div>
                  <p className="mb-3 text-xs font-bold text-brand-muted">{text(c.stepOf, { step, total: TOTAL_STEPS })}</p>
                  <h2 className="font-serif text-2xl font-bold text-brand-gold md:text-3xl">{heading}</h2>
                </div>

                {step === 1 && <input autoFocus aria-label={c.stepName} value={name} onChange={(event) => setTypedName(event.target.value)} placeholder={c.namePlaceholder} autoComplete="name" className={inputClass} />}
                {step === 2 && <input autoFocus aria-label={c.stepPhone} type="tel" dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={c.phonePlaceholder} autoComplete="tel" className={`${inputClass} text-start`} />}
                {step === 3 && (
                  <div className="space-y-6">
                    <Select ariaLabel={c.stepProperty} placeholder={c.propertyPlaceholder} value={propertyId} onChange={setPropertyId} options={propertyOptions} />
                    {loadFailed && <p role="alert" className="text-sm text-amber-200">{c.loadError}</p>}
                    <label className="grid gap-2 text-sm text-brand-sand">
                      {c.dateLabel}
                      <input type="date" dir="ltr" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded border border-white/15 bg-black/20 p-3 text-brand-ivory" />
                    </label>
                  </div>
                )}
                {step === 4 && <textarea autoFocus aria-label={c.stepMessage} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={c.messagePlaceholder} className="w-full rounded border border-white/15 bg-black/20 p-4 text-lg text-brand-ivory placeholder:text-brand-sand/30" />}

                {error && <p role="alert" className="rounded border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}

                <div className="flex items-center gap-4">
                  {step > 1 && (
                    <button type="button" onClick={() => setStep(step - 1)} className="rounded border border-white/20 px-5 py-3 text-sm font-semibold text-brand-sand hover:border-brand-gold">
                      {dict.common.back}
                    </button>
                  )}
                  <button type="submit" disabled={!isValid(step) || submitting} className="rounded bg-brand-gold px-8 py-3 text-xs font-extrabold uppercase tracking-widest text-brand-obsidian transition disabled:cursor-not-allowed disabled:opacity-50">
                    {step < TOTAL_STEPS ? c.next : submitting ? c.submitting : c.submit}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Phone, label: c.directLine, value: contact.phone ?? "—", ltr: true },
            { icon: Mail, label: c.conciergeEmail, value: contact.email ?? "—", ltr: true },
            { icon: MapPin, label: c.office, value: dict.footer.addressLine2, ltr: false },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-brand-gold/20 bg-brand-obsidian/60 p-6 backdrop-blur-sm">
              <card.icon className="mb-3 h-5 w-5 text-brand-gold" aria-hidden="true" />
              <p className="font-bold text-brand-ivory">{card.label}</p>
              <p dir={card.ltr ? "ltr" : undefined} className="mt-1 text-sm text-brand-muted text-start">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
