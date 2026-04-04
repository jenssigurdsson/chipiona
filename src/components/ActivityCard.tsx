import { motion } from "framer-motion";
import type { Activity, Language } from "../types";
import { CATEGORY_EMOJI } from "./CategoryPills";

interface Props {
  activity: Activity;
  lang: Language;
  isFavorite: boolean;
  isVisited: boolean;
  onClick: () => void;
}

export function ActivityCard({ activity, lang, isFavorite, isVisited, onClick }: Props) {
  const name =
    lang === "is" ? activity.name_is :
    lang === "es" ? activity.name_es :
    activity.name_en;

  return (
    <motion.div
      className="card"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="card__icon">
        {CATEGORY_EMOJI[activity.category]}
      </div>
      <div className="card__body">
        <div className="card__name">{name}</div>
        <div className="card__tags">
          {activity.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <div className="card__meta">
          {activity.price_range && (
            <span className="price-badge">{activity.price_range}</span>
          )}
          {activity.equipment_rental && <span>🎿 rental</span>}
          {isFavorite && <span>❤️</span>}
          {isVisited && <span>✅</span>}
        </div>
      </div>
    </motion.div>
  );
}
