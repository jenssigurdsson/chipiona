import { en } from "./en";
import { is } from "./is";
import { es } from "./es";
import type { Language } from "../types";

export const translations = { en, is, es };

export function t(lang: Language) {
  return translations[lang] ?? en;
}
