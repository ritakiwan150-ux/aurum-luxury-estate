import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  ar: () => import("./dictionaries/ar").then((module) => module.default),
  en: () => import("./dictionaries/en").then((module) => module.default),
};

export const getDictionary = (locale: Locale): Promise<Dictionary> => dictionaries[locale]();
