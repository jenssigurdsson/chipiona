import { useRef } from "react";
import type { Category, Language } from "../types";
import { t } from "../i18n";

const CATEGORIES: Array<{ key: Category | "all"; emoji: string }> = [
  { key: "all",         emoji: "🌍" },
  { key: "beach",       emoji: "🏖️" },
  { key: "sightseeing", emoji: "🏛️" },
  { key: "walking",     emoji: "🚶" },
  { key: "restaurant",  emoji: "🍽️" },
  { key: "sports",      emoji: "🏃" },
  { key: "explore",     emoji: "🔍" },
  { key: "other",       emoji: "✨" },
];

interface Props {
  active: Category | "all";
  onChange: (cat: Category | "all") => void;
  lang: Language;
}

export function CategoryPills({ active, onChange, lang }: Props) {
  const tr = t(lang);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  function onMouseDown(e: React.MouseEvent) {
    if (!ref.current) return;
    drag.current = { active: true, startX: e.clientX, scrollLeft: ref.current.scrollLeft, moved: false };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!drag.current.active || !ref.current) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 6) drag.current.moved = true;
    ref.current.scrollLeft = drag.current.scrollLeft - dx;
  }

  function onMouseUp() {
    drag.current.active = false;
  }

  return (
    <div
      ref={ref}
      className="category-pills"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {CATEGORIES.map(({ key, emoji }) => (
        <button
          key={key}
          className={`pill${active === key ? " active" : ""}`}
          onClick={() => { if (!drag.current.moved) onChange(key); }}
        >
          {emoji} {key === "all" ? tr.categories.all : tr.categories[key]}
        </button>
      ))}
    </div>
  );
}

export const CATEGORY_EMOJI: Record<Category | "all", string> = Object.fromEntries(
  CATEGORIES.map(({ key, emoji }) => [key, emoji])
) as Record<Category | "all", string>;
