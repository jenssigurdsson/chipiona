import { useState, useCallback } from "react";
import { Compass, Map, CalendarDays, Heart, LogIn, LogOut } from "lucide-react";
import { useActivities } from "./hooks/useActivities";
import { useLanguage } from "./hooks/useLanguage";
import { useUserData } from "./hooks/useUserData";
import { useAuth } from "./hooks/useAuth";
import { filterActivities } from "./lib/activities";
import { t } from "./i18n";
import { CategoryPills } from "./components/CategoryPills";
import { ActivityCard } from "./components/ActivityCard";
import { ActivityDetail } from "./components/ActivityDetail";
import { HomeView } from "./components/HomeView";
import { LoginSheet } from "./components/LoginSheet";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { MapView } from "./components/MapView";
import { ItineraryPlanner } from "./components/ItineraryPlanner";
import type { Activity, Category } from "./types";

type Tab = "list" | "map" | "itinerary" | "mylist";

export default function App() {
  const { activities, loading } = useActivities();
  const { lang, setLang } = useLanguage();
  const tr = t(lang);

  const { user, signIn, signOut } = useAuth();
  const userId = user?.id ?? null;
  const { userActivities, toggleFavorite, toggleVisited, saveNote } = useUserData(userId);

  const [tab, setTab] = useState<Tab>("list");
  const [showLogin, setShowLogin] = useState(false);
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

  const NAV: Array<{ key: Tab; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; fill?: string }>; label: string }> = [
    { key: "list",      Icon: Compass,      label: tr.nav.list },
    { key: "map",       Icon: Map,          label: tr.nav.map },
    { key: "itinerary", Icon: CalendarDays, label: tr.nav.itinerary },
    { key: "mylist",    Icon: Heart,        label: tr.nav.mylist },
  ];

  return (
    <div className="app">
      <header className="header">
        <span className="header__title">{tr.app_name}</span>
        <div className="header__actions">
          <LanguageSwitcher lang={lang} setLang={setLang} />
          {user ? (
            <button className="lang-btn" onClick={signOut} title={tr.ui.logout}>
              <LogOut size={13} strokeWidth={2} />
            </button>
          ) : (
            <button className="lang-btn" onClick={() => setShowLogin(true)} title={tr.ui.login}>
              <LogIn size={13} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      <div className="tile-divider" />

      <main className="content">
        {tab === "list" && (
          <>
            <CategoryPills active={category} onChange={(cat) => { setCategory(cat); setQuery(""); }} lang={lang} />
            {category === "all" ? (
              loading ? (
                <div className="empty">{tr.ui.loading}</div>
              ) : (
                <HomeView
                  activities={activities}
                  lang={lang}
                  onSelect={setSelected}
                  onSeeAll={(cat) => setCategory(cat)}
                />
              )
            ) : (
              <>
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
            {!user ? (
              <div className="empty" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <Heart size={36} strokeWidth={1.25} color="var(--sand)" />
                <span>{tr.ui.my_favorites}</span>
                <button className="btn-primary" style={{ width: "auto", padding: "10px 24px" }} onClick={() => setShowLogin(true)}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <LogIn size={14} strokeWidth={2} /> {tr.ui.login}
                  </span>
                </button>
              </div>
            ) : Object.entries(userActivities).filter(([, ua]) => ua.is_favorite).length === 0 ? (
              <div className="empty">
                <Heart size={36} strokeWidth={1.25} color="var(--sand)" style={{ margin: "0 auto 8px" }} />
                <br />{tr.ui.my_favorites}
              </div>
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
        {NAV.map(({ key, Icon, label }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              className={`bottom-nav__item${isActive ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 0 : 1.75}
                fill={isActive ? "currentColor" : "none"}
              />
              {label}
            </button>
          );
        })}
      </nav>

      {showLogin && (
        <LoginSheet
          lang={lang}
          onClose={() => setShowLogin(false)}
          onSignIn={signIn}
        />
      )}

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
