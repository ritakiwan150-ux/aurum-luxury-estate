"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "../lib/api";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../providers/AuthProvider";
import Select, { type SelectOption } from "./ui/Select";

const inputClass = "w-full rounded border border-white/15 bg-black/20 px-4 py-3 text-brand-ivory";

export default function AuthForm() {
  const { lang, dict, href } = useI18n();
  const { user, ready, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const a = dict.auth;

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [role, setRole] = useState<"client" | "owner">("client");
  const [license, setLicense] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Only follow `next` links that stay on this site and in this language.
  const requested = searchParams.get("next");
  const destination = requested && requested.startsWith(`/${lang}/`) && !requested.startsWith("//") ? requested : href("/account");

  useEffect(() => {
    if (ready && user) router.replace(destination);
  }, [ready, user, router, destination]);

  const roleOptions: SelectOption[] = [
    { value: "client", label: a.client, icon: "user" },
    { value: "owner", label: a.owner, icon: "briefcase" },
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (isRegistering && password !== passwordConfirmation) {
      setError(a.passwordMismatch);
      return;
    }
    setSubmitting(true);
    try {
      const result = isRegistering
        ? await api.register({
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
            role,
            ...(role === "owner" && license ? { broker_license_number: license } : {}),
          })
        : await api.login({ email, password });
      login(result.user);
      router.push(destination);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : a.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-surface min-h-screen px-6 pb-20 pt-36 text-brand-ivory">
      <div className="glass-panel mx-auto w-full max-w-xl rounded-2xl p-8 md:p-12">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-brand-gold">{a.eyebrow}</p>
        <h1 className="mb-3 font-serif text-4xl font-bold">{isRegistering ? a.registerTitle : a.signInTitle}</h1>
        <p className="mb-8 text-sm text-brand-muted">{a.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <>
              <label className="block space-y-2 text-sm text-brand-sand">
                <span>{a.fullName}</span>
                <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
              </label>
              <div className="block space-y-2 text-sm text-brand-sand">
                <span>{a.accountType}</span>
                <Select ariaLabel={a.accountType} value={role} onChange={(value) => setRole(value === "owner" ? "owner" : "client")} options={roleOptions} />
              </div>
              {role === "owner" && (
                <label className="block space-y-2 text-sm text-brand-sand">
                  <span>{a.license}</span>
                  <input dir="ltr" value={license} onChange={(event) => setLicense(event.target.value)} className={inputClass} />
                  <span className="block text-xs text-brand-muted">{a.licenseHint}</span>
                </label>
              )}
            </>
          )}

          <label className="block space-y-2 text-sm text-brand-sand">
            <span>{a.email}</span>
            <input type="email" dir="ltr" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
          </label>
          <label className="block space-y-2 text-sm text-brand-sand">
            <span>{a.password}</span>
            <input type="password" dir="ltr" required minLength={8} autoComplete={isRegistering ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
          </label>
          {isRegistering && (
            <label className="block space-y-2 text-sm text-brand-sand">
              <span>{a.confirmPassword}</span>
              <input type="password" dir="ltr" required minLength={8} autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className={inputClass} />
            </label>
          )}

          {error && <p role="alert" className="rounded border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}

          <button disabled={submitting} className="w-full rounded bg-brand-gold px-5 py-3 font-bold uppercase tracking-widest text-brand-obsidian disabled:opacity-60">
            {submitting ? a.wait : isRegistering ? a.createAccount : a.signIn}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm">
          <button type="button" onClick={() => { setIsRegistering((value) => !value); setError(""); }} className="text-brand-gold hover:text-brand-amber">
            {isRegistering ? a.haveAccount : a.newHere}
          </button>
          <Link href={href("/")} className="text-brand-muted hover:text-brand-ivory">{a.back}</Link>
        </div>
      </div>
    </div>
  );
}
