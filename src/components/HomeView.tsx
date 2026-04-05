import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Activity, Category, Language } from "../types";
import { CATEGORY_ICONS, CATEGORY_COLOR } from "./categoryIcons";
import { t } from "../i18n";

const HOME_SECTIONS: Category[] = [
  "restaurant", "beach", "sightseeing", "walking", "sports", "explore",
];

interface Props {
  activities: Activity[];
  lang: Language;
  onSelect: (a: Activity) => void;
  onSeeAll: (cat: Category) => void;
}

export function HomeView({ activities, lang, onSelect, onSeeAll }: Props) {
  const tr = t(lang);

  return (
    <div className="home">
      {HOME_SECTIONS.map((cat) => {
        const items = activities.filter((a) => a.category === cat).slice(0, 8);
        if (items.length === 0) return null;
        const Icon = CATEGORY_ICONS[cat];
        const color = CATEGORY_COLOR[cat];

        return (
          <section key={cat} className="home-section">
            <div className="home-section__header">
              <div className="home-section__title" style={{ color }}>
                <Icon size={15} strokeWidth={2} />
                {tr.categories[cat]}
              </div>
              <button
                className="home-section__see-all"
                onClick={() => onSeeAll(cat)}
              >
                {tr.ui.see_all}
                <ChevronRight size={13} strokeWidth={2.5} />
              </button>
            </div>

            <div className="home-strip">
              {items.map((a, i) => {
                const name =
                  lang === "is" ? a.name_is :
                  lang === "es" ? a.name_es :
                  a.name_en;
                const tag = a.tags[0];

                return (
                  <motion.div
                    key={a.id}
                    className="home-card"
                    onClick={() => onSelect(a)}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.16, delay: i * 0.04 }}
                  >
                    <div
                      className="home-card__icon"
                      style={{ background: `${color}1a`, color }}
                    >
                      <Icon size={30} strokeWidth={1.5} />
                    </div>
                    <div className="home-card__name">{name}</div>
                    <div className="home-card__foot">
                      {a.price_range && (
                        <span className="home-card__price">{a.price_range}</span>
                      )}
                      {tag && (
                        <span className="home-card__tag">
                          {tr.tags[tag] ?? tag}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
