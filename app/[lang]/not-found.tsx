"use client";

import StatusPage from "@/src/components/StatusPage";
import { useI18n } from "@/src/i18n/I18nProvider";

export default function NotFound() {
  const { dict } = useI18n();
  return <StatusPage code="404" title={dict.errors.notFoundTitle} text={dict.errors.notFoundText} />;
}
