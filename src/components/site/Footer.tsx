"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "../../i18n/I18nProvider";
import { api } from "../../lib/api";

export default function Footer() {
  const { dict, href, text } = useI18n();
  const [year, setYear] = useState<number | null>(null);
  const [contact, setContact] = useState<{ phone?: string; email?: string }>({});

  useEffect(() => {
    // Read the browser's year after hydration so the prerendered HTML stays deterministic.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(new Date().getFullYear());
    api.publicSettings()
      .then(({ settings }) => setContact({ phone: settings.contact_phone ?? undefined, email: settings.contact_email ?? undefined }))
      .catch(() => undefined);
  }, []);

  const f = dict.footer;
  const linkClass = "transition-colors hover:text-brand-gold";
  const heading = "text-xs font-extrabold uppercase tracking-widest text-brand-gold";

  return (
    <footer className="border-t border-white/10 bg-brand-obsidian/90 py-16 text-brand-sand">
      <div className="container-page grid grid-cols-1 gap-12 md:grid-cols-4">
        <div className="space-y-4">
          <Link href={href("/")} className="font-serif text-2xl font-bold tracking-[0.25em] text-brand-gold">
            AURUM
          </Link>
          <p className="max-w-xs text-xs leading-relaxed text-brand-muted">{f.about}</p>
        </div>

        <div className="space-y-4">
          <h2 className={heading}>{f.portfolio}</h2>
          <ul className="space-y-3 text-sm font-semibold">
            <li><Link className={linkClass} href={href("/properties")}>{f.collection}</Link></li>
            <li><Link className={linkClass} href={href("/properties?q=Villa")}>{f.villas}</Link></li>
            <li><Link className={linkClass} href={href("/properties?q=Apartment")}>{f.apartments}</Link></li>
            <li><Link className={linkClass} href={href("/properties?op=rent")}>{f.rent}</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className={heading}>{f.concierge}</h2>
          <ul className="space-y-3 text-sm font-semibold">
            <li><Link className={linkClass} href={href("/concierge")}>{f.requestViewing}</Link></li>
            <li><Link className={linkClass} href={href("/account")}>{f.workspace}</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className={heading}>{f.headquarters}</h2>
          <address className="text-xs font-medium not-italic leading-relaxed text-brand-sand">
            {f.addressLine1}<br />
            {f.addressLine2}<br />
            {f.addressLine3}
          </address>
          <p className="text-xs font-bold text-brand-gold">
            {contact.phone && <>{f.tel}: <a dir="ltr" className="hover:underline" href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a><br /></>}
            {contact.email && <>{f.email}: <a className="hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a></>}
          </p>
        </div>
      </div>

      <div className="container-page mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-12 text-[11px] font-bold tracking-widest text-brand-muted md:flex-row">
        <span>{text(f.rights, { year: year ?? "" })}</span>
        <span>{f.license}</span>
      </div>
    </footer>
  );
}
