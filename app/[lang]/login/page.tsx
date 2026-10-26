import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "@/src/i18n/config";
import { getDictionary } from "@/src/i18n/dictionaries";
import AuthForm from "@/src/components/AuthForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/login">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.meta.loginTitle, robots: { index: false } };
}

export default async function LoginPage({ params }: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <Suspense fallback={<div className="page-surface min-h-screen" />}>
      <AuthForm />
    </Suspense>
  );
}
