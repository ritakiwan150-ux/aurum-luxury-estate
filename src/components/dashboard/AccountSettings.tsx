"use client";

import { FormEvent, useState } from "react";
import { ApiUser, api } from "../../lib/api";
import { Notice, errorMessage } from "./shared";
import { useI18n } from "../../i18n/I18nProvider";

interface AccountSettingsProps {
  user: ApiUser;
  token: string;
  onUserUpdate?: (user: ApiUser) => void;
}

type Message = { kind: "ok" | "error"; text: string } | null;

const inputClass = "w-full rounded border border-white/15 bg-black/20 p-3";

export default function AccountSettings({ user, token, onUserUpdate }: AccountSettingsProps) {
  const { t } = useI18n();
  const [name, setName] = useState(user.name);
  const [profileMessage, setProfileMessage] = useState<Message>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [passwordMessage, setPasswordMessage] = useState<Message>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage(null);
    setSavingProfile(true);
    try {
      const { user: updated } = await api.updateProfile({ name: name.trim() }, token);
      onUserUpdate?.(updated);
      setProfileMessage({ kind: "ok", text: t("Profile updated.") });
    } catch (cause) {
      setProfileMessage({ kind: "error", text: errorMessage(cause, t("Could not update your profile.")) });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage(null);
    if (passwords.password !== passwords.password_confirmation) {
      setPasswordMessage({ kind: "error", text: t("The new password and its confirmation do not match.") });
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword(passwords, token);
      setPasswords({ current_password: "", password: "", password_confirmation: "" });
      setPasswordMessage({ kind: "ok", text: t("Password updated. Your other devices were signed out.") });
    } catch (cause) {
      setPasswordMessage({ kind: "error", text: errorMessage(cause, t("Could not change your password.")) });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="glass-panel rounded-xl p-6">
        <h2 className="mb-1 font-serif text-2xl">{t("Profile")}</h2>
        <p className="mb-5 text-sm text-brand-muted">{t("Update the name shown on your account.")}</p>
        <form onSubmit={saveProfile} className="space-y-4">
          <label className="grid gap-1 text-xs text-brand-muted">
            {t("Full name")}
            <input required maxLength={255} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
          </label>
          <label className="grid gap-1 text-xs text-brand-muted">
            {t("Email")}
            <input readOnly value={user.email} className={`${inputClass} cursor-not-allowed opacity-60`} />
          </label>
          {profileMessage && <Notice kind={profileMessage.kind}>{profileMessage.text}</Notice>}
          <button disabled={savingProfile || !name.trim()} className="rounded bg-brand-gold px-5 py-3 font-bold text-brand-obsidian disabled:cursor-not-allowed disabled:opacity-50">
            {savingProfile ? t("Saving…") : t("Save profile")}
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-xl p-6">
        <h2 className="mb-1 font-serif text-2xl">{t("Password")}</h2>
        <p className="mb-5 text-sm text-brand-muted">{t("Use at least 8 characters.")}</p>
        <form onSubmit={savePassword} className="space-y-4">
          <label className="grid gap-1 text-xs text-brand-muted">
            {t("Current password")}
            <input required type="password" autoComplete="current-password" value={passwords.current_password} onChange={(event) => setPasswords({ ...passwords, current_password: event.target.value })} className={inputClass} />
          </label>
          <label className="grid gap-1 text-xs text-brand-muted">
            {t("New password")}
            <input required minLength={8} type="password" autoComplete="new-password" value={passwords.password} onChange={(event) => setPasswords({ ...passwords, password: event.target.value })} className={inputClass} />
          </label>
          <label className="grid gap-1 text-xs text-brand-muted">
            {t("Confirm new password")}
            <input required minLength={8} type="password" autoComplete="new-password" value={passwords.password_confirmation} onChange={(event) => setPasswords({ ...passwords, password_confirmation: event.target.value })} className={inputClass} />
          </label>
          {passwordMessage && <Notice kind={passwordMessage.kind}>{passwordMessage.text}</Notice>}
          <button disabled={savingPassword} className="rounded bg-brand-gold px-5 py-3 font-bold text-brand-obsidian disabled:cursor-not-allowed disabled:opacity-50">
            {savingPassword ? t("Updating…") : t("Change password")}
          </button>
        </form>
      </section>
    </div>
  );
}
