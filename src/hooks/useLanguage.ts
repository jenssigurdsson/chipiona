import { useState } from "react";
import type { Language } from "../types";

const STORAGE_KEY = "chipiona_lang";

function getInitialLang(): Language {
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (stored && ["en", "is", "es"].includes(stored)) return stored;
  const browser = navigator.language.slice(0, 2) as Language;
  if (["en", "is", "es"].includes(browser)) return browser;
  return "en";
}

export function useLanguage() {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  function setLang(l: Language) {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }

  return { lang, setLang };
}
