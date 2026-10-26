import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/src/i18n/config";
import { getDictionary } from "@/src/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.meta.aboutTitle, description: dict.meta.aboutDescription };
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = (await getDictionary(lang)).about;

  return (
    <div className="page-surface min-h-screen px-6 pb-20 pt-36 text-brand-ivory md:px-16">
      <section className="glass-panel mx-auto max-w-4xl rounded-2xl p-8 md:p-14">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-brand-gold">{dict.eyebrow}</p>
        <h1 className="mb-6 font-serif text-4xl font-bold md:text-5xl">{dict.title}</h1>
        <p className="mb-5 text-base leading-relaxed text-brand-sand">{dict.p1}</p>
        <p className="text-base leading-relaxed text-brand-sand">{dict.p2}</p>
        <Link href={`/${lang}/properties`} className="mt-8 inline-block rounded bg-brand-gold px-5 py-3 text-xs font-bold uppercase tracking-widest text-brand-obsidian transition hover:brightness-110">
          {dict.cta}
        </Link>
      </section>
    </div>
  );
}
