import { motion, AnimatePresence } from "framer-motion";
import type { Activity, Language } from "../types";
import { t } from "../i18n";

interface Props {
  activity: Activity | null;
  lang: Language;
  isFavorite: boolean;
  isVisited: boolean;
  note: string | null;
  onClose: () => void;
  onToggleFavorite: () => void;
  onToggleVisited: () => void;
  onSaveNote: (note: string) => void;
  onAddToItinerary: () => void;
  isLoggedIn: boolean;
}

export function ActivityDetail({
  activity,
  lang,
  isFavorite,
  isVisited,
  note,
  onClose,
  onToggleFavorite,
  onToggleVisited,
  onSaveNote,
  onAddToItinerary,
  isLoggedIn,
}: Props) {
  const tr = t(lang);

  if (!activity) return null;

  const name =
    lang === "is" ? activity.name_is :
    lang === "es" ? activity.name_es :
    activity.name_en;

  const description =
    lang === "is" ? activity.description_is :
    lang === "es" ? activity.description_es :
    activity.description_en;

  return (
    <AnimatePresence>
      <motion.div
        className="sheet-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sheet__handle" />

          <div className="sheet__name">{name}</div>

          <div className="card__tags" style={{ marginBottom: 12 }}>
            {activity.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
            {activity.price_range && (
              <span className="tag" style={{ color: "var(--terracotta)" }}>
                {activity.price_range === "free" ? tr.price.free : activity.price_range}
              </span>
            )}
            {activity.best_time && (
              <span className="tag">{tr.best_time[activity.best_time]}</span>
            )}
          </div>

          <div className="sheet__description">{description}</div>

          {activity.address && (
            <p style={{ fontSize: 13, color: "#777", marginBottom: 14 }}>
              📍 {activity.address}
            </p>
          )}

          {activity.equipment_rental && (
            <p style={{ fontSize: 13, color: "var(--tile)", marginBottom: 14 }}>
              🎿 {tr.ui.equipment_rental}
            </p>
          )}

          {isLoggedIn && (
            <>
              <div className="sheet__actions">
                <button
                  className={`btn${isFavorite ? " active" : ""}`}
                  onClick={onToggleFavorite}
                >
                  {isFavorite ? "❤️" : "🤍"} {tr.ui.favorite}
                </button>
                <button
                  className={`btn${isVisited ? " active" : ""}`}
                  onClick={onToggleVisited}
                >
                  {isVisited ? "✅" : "⬜"} {tr.ui.mark_visited}
                </button>
              </div>

              <textarea
                placeholder={tr.ui.add_note}
                defaultValue={note ?? ""}
                onBlur={(e) => onSaveNote(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 10,
                  border: "1.5px solid var(--sand)",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  resize: "vertical",
                  minHeight: 80,
                  marginBottom: 12,
                  outline: "none",
                }}
              />
            </>
          )}

          <button className="btn-primary" onClick={onAddToItinerary}>
            + {tr.ui.add_to_itinerary}
          </button>

          {activity.source_urls.filter(Boolean).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>
                {tr.ui.sources}
              </p>
              {activity.source_urls.filter(Boolean).map((url, i) => (
                <a
                  key={i}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", fontSize: 12, color: "var(--tile)", marginBottom: 2 }}
                >
                  {url}
                </a>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
