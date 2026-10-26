"use client";

import StatusPage from "@/src/components/StatusPage";
import { useI18n } from "@/src/i18n/I18nProvider";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { dict } = useI18n();
  return <StatusPage title={dict.errors.errorTitle} text={dict.errors.errorText} onRetry={retry} />;
}
