import { motion } from "framer-motion";
import { Heart, CheckCircle, Bike } from "lucide-react";
import type { Activity, Language } from "../types";
import { CATEGORY_ICONS, CATEGORY_COLOR } from "./categoryIcons";

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

  const Icon = CATEGORY_ICONS[activity.category] ?? CATEGORY_ICONS.other;
  const color = CATEGORY_COLOR[activity.category] ?? "#888";

  return (
    <motion.div
      className="card"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="card__icon" style={{ color, background: `${color}18` }}>
        <Icon size={22} strokeWidth={1.75} />
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
          {activity.equipment_rental && (
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Bike size={12} strokeWidth={1.75} /> rental
            </span>
          )}
          {isFavorite && <Heart size={12} fill="var(--sun)" color="var(--sun)" />}
          {isVisited && <CheckCircle size={12} color="var(--tile)" strokeWidth={2} />}
        </div>
      </div>
    </motion.div>
  );
}
