"use client";

import Link from "next/link";
import { useI18n } from "../i18n/I18nProvider";

interface StatusPageProps {
  code?: string;
  title: string;
  text: string;
  onRetry?: () => void;
}

export default function StatusPage({ code, title, text, onRetry }: StatusPageProps) {
  const { dict, href } = useI18n();
  return (
    <div className="flex min-h-[70vh] items-center justify-center page-surface px-6 pb-20 pt-36">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-10 text-center">
        {code && <p className="mb-2 font-serif text-6xl font-bold text-brand-gold">{code}</p>}
        <h1 className="mb-3 font-serif text-3xl font-bold text-brand-ivory">{title}</h1>
        <p className="mb-8 text-brand-sand">{text}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button type="button" onClick={onRetry} className="rounded border border-brand-gold/40 px-5 py-3 text-xs font-bold uppercase tracking-widest text-brand-gold hover:bg-brand-gold/10">
              {dict.common.retry}
            </button>
          )}
          <Link href={href("/")} className="rounded bg-brand-gold px-5 py-3 text-xs font-bold uppercase tracking-widest text-brand-obsidian transition hover:brightness-110">
            {dict.errors.goHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
