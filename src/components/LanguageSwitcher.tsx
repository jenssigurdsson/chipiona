import type { Language } from "../types";

interface Props {
  lang: Language;
  setLang: (l: Language) => void;
}

export function LanguageSwitcher({ lang, setLang }: Props) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {(["en", "is", "es"] as Language[]).map((l) => (
        <button
          key={l}
          className={`lang-btn${lang === l ? " active" : ""}`}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
