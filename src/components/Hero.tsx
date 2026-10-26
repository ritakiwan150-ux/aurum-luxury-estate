"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { ApiNamedItem } from "../lib/api";
import { useI18n } from "../i18n/I18nProvider";
import Select, { type SelectOption } from "./ui/Select";

interface HeroProps {
  cities: ApiNamedItem[];
  propertyTypes: ApiNamedItem[];
  optionsFailed?: boolean;
}

export default function Hero({ cities, propertyTypes, optionsFailed = false }: HeroProps) {
  const { dict, href, pick } = useI18n();
  const router = useRouter();
  const [cityId, setCityId] = useState("");
  const [typeId, setTypeId] = useState("");
  const h = dict.home;

  const cityOptions: SelectOption[] = [
    { value: "", label: h.allCities, icon: "map-pin" },
    ...cities.map((city) => ({ value: String(city.id), label: pick(city as unknown as Record<string, unknown>, "name"), icon: "map-pin" })),
  ];
  const typeOptions: SelectOption[] = [
    { value: "", label: h.propertyType, icon: "building-2" },
    ...propertyTypes.map((type) => ({ value: String(type.id), label: pick(type as unknown as Record<string, unknown>, "name"), icon: type.icon })),
  ];

  const explore = () => {
    const params = new URLSearchParams();
    if (cityId) params.set("city", cityId);
    if (typeId) params.set("type", typeId);
    const query = params.toString();
    router.push(`${href("/properties")}${query ? `?${query}` : ""}`);
  };

  return (
    <section className="relative flex min-h-[90vh] items-center justify-center bg-brand-obsidian/65 pb-16 pt-28 md:h-screen">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#0B111E_100%)] opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,17,30,0.55)_0%,transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-obsidian to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gold/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center px-4 text-center">
        <motion.p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-brand-gold md:text-sm" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          {h.eyebrow}
        </motion.p>

        <motion.h1 className="mb-6 font-serif text-5xl font-bold leading-[1.1] tracking-tight text-brand-ivory md:text-7xl" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
          <span className="mb-2 block text-4xl font-normal italic text-brand-sand md:text-5xl">{h.titleTop}</span>
          <span className="block text-5xl font-bold uppercase tracking-widest text-brand-gold md:text-7xl">{h.titleMain}</span>
        </motion.h1>

        <motion.p className="mx-auto mb-12 max-w-2xl text-base leading-relaxed text-brand-sand md:text-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}>
          {h.subtitle}
        </motion.p>

        <motion.div className="z-30 w-full max-w-4xl px-4" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.7 }}>
          <div className="glass-card flex flex-col items-center gap-3 rounded-xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:flex-row md:rounded-full">
            <div className="w-full flex-1 px-2">
              <Select ariaLabel={h.allCities} value={cityId} onChange={setCityId} options={cityOptions} className="w-full" />
            </div>
            <div className="hidden h-8 w-px bg-white/10 md:block" />
            <div className="w-full flex-1 px-2">
              <Select ariaLabel={h.propertyType} value={typeId} onChange={setTypeId} options={typeOptions} className="w-full" />
            </div>
            <motion.button
              type="button"
              onClick={explore}
              className="flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-gold px-8 py-3.5 font-bold text-brand-obsidian transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 md:w-auto md:rounded-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-xs font-extrabold uppercase tracking-widest">{h.explore}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </motion.button>
          </div>
          {optionsFailed && <p role="status" className="mt-2 text-start text-xs text-amber-200">{h.optionsError}</p>}
        </motion.div>
      </div>
    </section>
  );
}
