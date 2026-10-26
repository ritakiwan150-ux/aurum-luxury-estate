"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, Droplet, ShieldCheck } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";

type LayerKey = "structure" | "interior" | "amenities";

const LAYERS: Array<{ id: number; key: LayerKey; image: string; icon: typeof Cpu; yOffset: number }> = [
  { id: 3, key: "structure", icon: Cpu, yOffset: -60, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNsHzigqhAKsyxevJAMyR3Wg3YMYqpw1i9Bk7IPmT8ogkD4t6e0eLs_ZuQxWVtBodhU0EEHwqbSdAwrE76UB1NVNyoEtH_R6XtfECATMjVi868vPVdmuCKj71uDMsWBZxjYAb77fe63W29em8HFZj1S0DvbC6pXMirKmEHcP8U5NUfGyW5x-J47_BBTPq3AnqGMPHDDLcDemK9VShDQp5YYyRjY4d2nr-sZGSaREkg7FmNRdDcXSyP" },
  { id: 2, key: "interior", icon: ShieldCheck, yOffset: 0, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCZVv35k5z3Myk7fBmWZ3figckivR0D-P2uT3_xqsV3AueiTvsU3hprjf8rwQEOu179i16r2rvwAYgmcDKFxf4jxIKaY0iijy8kMi9wM8ftP4HzXaT8Q2eEzKZ__7amBlsUVKOmh9bNpAJtPVglHhLGxg-MgQL5zjF6E_oymn9B9N10OWCwcTLO5JIp1bbes_yhwhiWFxb5AzBucyFLUAeI_ziyBaDBwsNpTsqOopKqCFF0Iw9it9K" },
  { id: 1, key: "amenities", icon: Droplet, yOffset: 60, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBA2VY4Yiqkw_CzDPw-iU9wh68dX_2h-PYBffowEud2YxpqtVMI9lojCiWlPdf3qRmoX1RznjB4muanTLduaT14bW_F3nF_gY6HgYUUIYds-jO1N3YzivXZgnkl81O4nnBpSx3bXM5pbNVPENiPww0NtKXzpdCKt_tNbzwt_VixYFMBdwePmkpb5_h0zhlY-ucR_JA66VMPYfmLg2EyUY7MN-S_BKHUG3i5-InXWQwEjyv_blrPFV-W" },
];

export default function ExplodedView() {
  const { dict, dir } = useI18n();
  const d = dict.home.dna;
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [isDeconstructed, setIsDeconstructed] = useState(true);
  const hoverShift = dir === "rtl" ? -6 : 6;
  const active = LAYERS.find((layer) => layer.id === activeLayer);

  const toggleLayer = (id: number) => {
    setIsDeconstructed(true);
    setActiveLayer(activeLayer === id ? null : id);
  };

  return (
    <section className="overflow-hidden border-y border-white/5 bg-brand-obsidian/35 py-24">
      <div className="container-page">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="space-y-8">
            <div className="inline-block rounded-full border border-brand-gold/30 bg-brand-gold/5 px-4 py-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">{d.eyebrow}</span>
            </div>

            <h2 className="font-serif text-4xl font-bold leading-tight text-brand-ivory md:text-5xl">
              {d.titleTop} <br />
              <span className="font-normal italic text-brand-sand">{d.titleAccent}</span>
            </h2>

            <p className="max-w-lg text-base leading-relaxed text-brand-sand md:text-lg">{d.body}</p>

            <div className="flex items-center gap-4 py-2">
              {[
                { deconstructed: true, label: d.deconstruct },
                { deconstructed: false, label: d.assemble },
              ].map((mode) => (
                <button
                  key={mode.label}
                  type="button"
                  aria-pressed={isDeconstructed === mode.deconstructed}
                  onClick={() => {
                    setIsDeconstructed(mode.deconstructed);
                    if (!mode.deconstructed) setActiveLayer(null);
                  }}
                  className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    isDeconstructed === mode.deconstructed ? "bg-brand-gold text-brand-obsidian" : "border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {LAYERS.map((layer, index) => {
                const isSelected = activeLayer === layer.id;
                const copy = d[layer.key];
                return (
                  <motion.button
                    type="button"
                    key={layer.id}
                    aria-pressed={isSelected}
                    className={`flex w-full cursor-pointer items-start gap-4 rounded-xl border p-4 text-start transition-all ${
                      isSelected ? "border-brand-gold/50 bg-brand-gold/10" : "border-white/5 bg-white/[0.01] hover:border-white/15"
                    }`}
                    onClick={() => toggleLayer(layer.id)}
                    whileHover={{ x: hoverShift }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all ${isSelected ? "border-brand-gold bg-brand-gold text-brand-obsidian" : "border-brand-gold/40 text-brand-gold"}`}>
                      <span className="text-xs font-extrabold">0{3 - index}</span>
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-bold text-brand-ivory">
                        {copy.title}
                        {isSelected && <span className="rounded bg-brand-gold/20 px-2 py-0.5 text-xs font-normal uppercase text-brand-gold">{d.activeView}</span>}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-brand-muted">{copy.desc}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="relative flex h-[550px] items-center justify-center rounded-2xl border border-white/5 bg-brand-obsidian/30 shadow-inner" aria-hidden="true">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="pointer-events-none absolute h-80 w-80 rounded-full bg-brand-gold/5 blur-[80px]" />

            <div className="relative flex h-full w-full max-w-sm items-center justify-center" dir="ltr">
              {LAYERS.map((layer) => {
                const isSelected = activeLayer === layer.id;
                const isDimmed = activeLayer !== null && activeLayer !== layer.id;
                let translateY = isDeconstructed ? layer.yOffset : 0;
                let scale = 1;
                if (isSelected) {
                  translateY = layer.yOffset * 1.5;
                  scale = 1.08;
                } else if (isDimmed) {
                  scale = 0.92;
                }
                return (
                  <motion.div
                    key={layer.id}
                    className="absolute w-72 cursor-pointer select-none transition-shadow duration-300 md:w-80"
                    style={{ transformStyle: "preserve-3d", zIndex: layer.id * 10 }}
                    animate={{ y: translateY, rotateX: 42, rotateZ: -32, scale, opacity: isDimmed ? 0.35 : isSelected ? 1 : 0.85 }}
                    transition={{ type: "spring", stiffness: isSelected ? 180 : 120, damping: 18 }}
                    onClick={() => toggleLayer(layer.id)}
                    whileHover={{ scale: isSelected ? 1.1 : 1.02, opacity: 1 }}
                  >
                    <div className="absolute -left-12 top-1/2 z-50 -translate-y-1/2 rounded border border-brand-gold-low bg-brand-obsidian/90 px-3 py-1.5 shadow-xl">
                      <span className="block whitespace-nowrap text-[11px] font-bold tracking-widest text-brand-gold">{d[layer.key].label}</span>
                    </div>
                    <div className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${isSelected ? "border-brand-gold shadow-[0_0_25px_rgba(212,175,55,0.35)]" : "border-brand-gold/20 shadow-lg"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={layer.image} alt="" className={`h-auto max-h-40 w-full object-cover transition-all ${layer.id === 1 ? "mix-blend-screen brightness-125" : ""}`} />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-brand-obsidian/30 via-white/5 to-transparent" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence>
              {active && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute inset-x-4 bottom-4 z-50 rounded-xl border border-brand-gold/30 bg-brand-obsidian/95 p-4 text-center backdrop-blur-md"
                >
                  <p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-brand-gold">{d[active.key].label}</p>
                  <p className="text-xs leading-relaxed text-brand-sand">{d[active.key].desc}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
