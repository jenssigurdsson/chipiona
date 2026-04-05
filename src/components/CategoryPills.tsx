import { useRef } from "react";
import type { Category, Language } from "../types";
import { t } from "../i18n";
import { CATEGORY_ICONS } from "./categoryIcons";

type CatKey = Category | "all";

const CATEGORY_KEYS: CatKey[] = [
  "all", "restaurant", "beach", "sightseeing", "walking", "sports", "explore", "other",
];

interface Props {
  active: CatKey;
  onChange: (cat: CatKey) => void;
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
  function onMouseUp() { drag.current.active = false; }

  return (
    <div
      ref={ref}
      className="category-pills"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {CATEGORY_KEYS.map((key) => {
        const Icon = CATEGORY_ICONS[key];
        const isActive = active === key;
        return (
          <button
            key={key}
            className={`pill${isActive ? " active" : ""}`}
            onClick={() => { if (!drag.current.moved) onChange(key); }}
          >
            <Icon
              size={15}
              strokeWidth={isActive ? 0 : 2}
              fill={isActive ? "currentColor" : "none"}
              color="currentColor"
            />
            {key === "all" ? tr.categories.all : tr.categories[key]}
          </button>
        );
      })}
    </div>
  );
}

export type { CatKey };
