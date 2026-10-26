"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ViewType } from "../types";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../providers/AuthProvider";
import AgentDashboard from "./AgentDashboard";

const VIEW_PATHS: Record<ViewType, string> = {
  home: "/",
  properties: "/properties",
  about: "/about",
  favorites: "/favorites",
  viewing: "/concierge",
  dashboard: "/account",
  login: "/login",
};

export default function AccountPage() {
  const { dict, href } = useI18n();
  const { user, token, ready, setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace(`${href("/login")}?next=${encodeURIComponent(href("/account"))}`);
  }, [ready, user, router, href]);

  if (!ready || !user || !token) {
    return <p role="status" className="px-6 pt-40 text-center text-brand-muted">{dict.common.loading}</p>;
  }

  return (
    <AgentDashboard
      user={user}
      token={token}
      onRequireAuth={() => router.push(href("/login"))}
      setView={(view) => router.push(href(VIEW_PATHS[view]))}
      onUserUpdate={setUser}
    />
  );
}
