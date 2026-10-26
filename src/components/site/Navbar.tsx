"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogIn, LogOut, Menu, Search, X } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { useAuth } from "../../providers/AuthProvider";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const { dict, href } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isClient = user?.roles?.some((role) => role.name === "client") ?? false;
  const links = [
    { path: "/", label: dict.nav.home },
    { path: "/properties", label: dict.nav.properties },
    { path: "/about", label: dict.nav.about },
    { path: "/concierge", label: dict.nav.concierge },
  ];
  const isActive = (path: string) => (path === "/" ? pathname === href("/") : pathname.startsWith(href(path)));

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push(href("/"));
  };

  const linkClass = (active: boolean) =>
    `text-sm font-semibold uppercase tracking-widest transition-colors duration-300 ${
      active ? "border-b border-brand-gold pb-1 text-brand-gold" : "text-brand-sand hover:text-brand-gold"
    }`;

  const accountHref = href("/account");
  const accountLabel = isClient ? dict.nav.myAccount : dict.nav.agentPortal;

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-brand-obsidian/85 backdrop-blur-xl">
      <div className="container-page flex items-center justify-between gap-4 py-4">
        <Link
          href={href("/")}
          onClick={() => setOpen(false)}
          className="select-none font-serif text-2xl font-bold tracking-[0.25em] text-brand-gold transition-transform hover:scale-[1.02] md:text-3xl"
        >
          AURUM
        </Link>

        <nav aria-label={dict.nav.mainNavigation} className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link key={link.path} href={href(link.path)} aria-current={isActive(link.path) ? "page" : undefined} className={linkClass(isActive(link.path))}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <Link href={href("/properties")} aria-label={dict.nav.search} title={dict.nav.search} className="p-3 text-brand-gold transition-colors hover:text-brand-amber">
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>

          <LanguageSwitcher className="hidden sm:inline-flex" />

          {user ? (
            <>
              <Link
                href={accountHref}
                className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition md:inline-flex ${
                  pathname.startsWith(accountHref) ? "border-brand-gold bg-brand-gold text-brand-obsidian" : "border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                <span>{accountLabel}</span>
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                aria-label={dict.nav.signOut}
                title={`${dict.nav.signOut} — ${user.name}`}
                className="hidden items-center gap-2 rounded border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand-sand transition hover:border-brand-gold/50 hover:text-brand-gold md:inline-flex"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">{dict.nav.signOut}</span>
              </button>
            </>
          ) : (
            <Link
              href={href("/login")}
              className="group hidden items-center gap-2 rounded-full border border-brand-gold/60 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold transition hover:bg-brand-gold hover:text-brand-obsidian md:inline-flex"
            >
              <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
              <span>{dict.nav.signIn}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? dict.nav.closeMenu : dict.nav.menu}
            className="rounded border border-white/15 p-2.5 text-brand-sand transition hover:border-brand-gold/50 hover:text-brand-gold md:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-white/10 bg-brand-obsidian/95 px-6 pb-6 pt-4 md:hidden">
          <nav aria-label={dict.nav.mainNavigation} className="flex flex-col">
            {links.map((link) => (
              <Link
                key={link.path}
                href={href(link.path)}
                onClick={() => setOpen(false)}
                aria-current={isActive(link.path) ? "page" : undefined}
                className={`border-b border-white/5 py-3 text-base font-semibold ${isActive(link.path) ? "text-brand-gold" : "text-brand-sand"}`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link href={accountHref} onClick={() => setOpen(false)} className="border-b border-white/5 py-3 text-base font-semibold text-brand-sand">
                {accountLabel}
              </Link>
            )}
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <button type="button" onClick={() => void handleLogout()} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-brand-sand">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {dict.nav.signOut}
              </button>
            ) : (
              <Link href={href("/login")} onClick={() => setOpen(false)} className="inline-flex items-center gap-2 rounded-full border border-brand-gold/60 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold">
                <LogIn className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                {dict.nav.signIn}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
