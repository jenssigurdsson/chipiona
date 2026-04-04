import { useState, useCallback } from "react";
import { useActivities } from "./hooks/useActivities";
import { useLanguage } from "./hooks/useLanguage";
import { useUserData } from "./hooks/useUserData";
import { filterActivities } from "./lib/activities";
import { t } from "./i18n";
import { CategoryPills } from "./components/CategoryPills";
import { ActivityCard } from "./components/ActivityCard";
import { ActivityDetail } from "./components/ActivityDetail";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { MapView } from "./components/MapView";
import { ItineraryPlanner } from "./components/ItineraryPlanner";
import type { Activity, Category } from "./types";

type Tab = "list" | "map" | "itinerary" | "mylist";

export default function App() {
  const { activities, loading } = useActivities();
  const { lang, setLang } = useLanguage();
  const tr = t(lang);

  const userId: string | null = null;
  const { userActivities, toggleFavorite, toggleVisited, saveNote } = useUserData(userId);

  const [tab, setTab] = useState<Tab>("list");
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Activity | null>(null);
  const [itineraryAdd, setItineraryAdd] = useState<Activity | null>(null);

  const filtered = filterActivities(activities, { category, query });

  const handleAddToItinerary = useCallback(() => {
    if (!selected) return;
    setItineraryAdd(selected);
    setSelected(null);
    setTab("itinerary");
  }, [selected]);

  const NAV: Array<{ key: Tab; icon: string; label: string }> = [
    { key: "list",      icon: "🧭", label: tr.nav.list },
    { key: "map",       icon: "🗺️",  label: tr.nav.map },
    { key: "itinerary", icon: "📅", label: tr.nav.itinerary },
    { key: "mylist",    icon: "❤️",  label: tr.nav.mylist },
  ];

  return (
    <div className="app">
      <header className="header">
        <span className="header__title">{tr.app_name}</span>
        <div className="header__actions">
          <LanguageSwitcher lang={lang} setLang={setLang} />
        </div>
      </header>

      <div className="tile-divider" />

      <main className="content">
        {tab === "list" && (
          <>
            <CategoryPills active={category} onChange={setCategory} lang={lang} />
            <div className="search-bar">
              <input
                type="search"
                placeholder={tr.ui.search_placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {loading ? (
              <div className="empty">{tr.ui.loading}</div>
            ) : filtered.length === 0 ? (
              <div className="empty">{tr.ui.no_results}</div>
            ) : (
              <div className="card-list">
                {filtered.map((a) => (
                  <ActivityCard
                    key={a.id}
                    activity={a}
                    lang={lang}
                    isFavorite={userActivities[a.id]?.is_favorite ?? false}
                    isVisited={userActivities[a.id]?.is_visited ?? false}
                    onClick={() => setSelected(a)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "map" && (
          <MapView
            activities={filtered}
            lang={lang}
            onSelect={(a) => setSelected(a)}
          />
        )}

        {tab === "itinerary" && (
          <ItineraryPlanner
            activities={activities}
            lang={lang}
            pendingAdd={itineraryAdd}
            onPendingConsumed={() => setItineraryAdd(null)}
          />
        )}

        {tab === "mylist" && (
          <div style={{ padding: 16 }}>
            {Object.entries(userActivities).filter(([, ua]) => ua.is_favorite).length === 0 ? (
              <div className="empty">❤️<br />Sign in to save favourites</div>
            ) : (
              <div className="card-list">
                {Object.values(userActivities)
                  .filter((ua) => ua.is_favorite)
                  .map((ua) => {
                    const a = activities.find((x) => x.id === ua.activity_id);
                    if (!a) return null;
                    return (
                      <ActivityCard
                        key={a.id}
                        activity={a}
                        lang={lang}
                        isFavorite={true}
                        isVisited={ua.is_visited}
                        onClick={() => setSelected(a)}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        {NAV.map(({ key, icon, label }) => (
          <button
            key={key}
            className={`bottom-nav__item${tab === key ? " active" : ""}`}
            onClick={() => setTab(key)}
          >
            <span className="bottom-nav__icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {selected && (
        <ActivityDetail
          activity={selected}
          lang={lang}
          isFavorite={userActivities[selected.id]?.is_favorite ?? false}
          isVisited={userActivities[selected.id]?.is_visited ?? false}
          note={userActivities[selected.id]?.note ?? null}
          onClose={() => setSelected(null)}
          onToggleFavorite={() => toggleFavorite(selected.id)}
          onToggleVisited={() => toggleVisited(selected.id)}
          onSaveNote={(n) => saveNote(selected.id, n)}
          onAddToItinerary={handleAddToItinerary}
          isLoggedIn={!!userId}
        />
      )}
    </div>
  );
}
