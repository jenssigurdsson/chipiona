import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Activity, Language } from "../types";
import { t } from "../i18n";
import { CATEGORY_ICONS } from "./categoryIcons";

const STORAGE_KEY = "chipiona_itinerary";

interface Day {
  id: string;
  label: string;
  activityIds: string[];
}

function loadDays(): Day[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [{ id: "day-1", label: "Day 1", activityIds: [] }];
}

function saveDays(days: Day[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
}

// ── Sortable activity item ────────────────────────────────────────────────────

function SortableItem({
  id,
  activity,
  lang,
  onRemove,
}: {
  id: string;
  activity: Activity | undefined;
  lang: Language;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!activity) return null;

  const name =
    lang === "is" ? activity.name_is :
    lang === "es" ? activity.name_es :
    activity.name_en;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="itinerary-item"
    >
      {(() => { const Icon = CATEGORY_ICONS[activity.category] ?? CATEGORY_ICONS.other; return <Icon size={18} strokeWidth={1.75} />; })()}
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{name}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{
          background: "none",
          border: "none",
          fontSize: 16,
          color: "#ccc",
          lineHeight: 1,
          padding: "0 4px",
        }}
      >
        ×
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  activities: Activity[];
  lang: Language;
  pendingAdd: Activity | null;
  onPendingConsumed: () => void;
}

export function ItineraryPlanner({ activities, lang, pendingAdd, onPendingConsumed }: Props) {
  const tr = t(lang);
  const [days, setDays] = useState<Day[]>(loadDays);
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Persist on change
  useEffect(() => { saveDays(days); }, [days]);

  // Add pending activity from detail sheet
  useEffect(() => {
    if (!pendingAdd) return;
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[activeDayIdx] };
      if (!day.activityIds.includes(pendingAdd.id)) {
        day.activityIds = [...day.activityIds, pendingAdd.id];
      }
      updated[activeDayIdx] = day;
      return updated;
    });
    onPendingConsumed();
  }, [pendingAdd, activeDayIdx, onPendingConsumed]);

  function addDay() {
    const newDay: Day = {
      id: `day-${Date.now()}`,
      label: `${tr.ui.day} ${days.length + 1}`,
      activityIds: [],
    };
    setDays((prev) => [...prev, newDay]);
    setActiveDayIdx(days.length);
  }

  function removeActivity(dayId: string, activityId: string) {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, activityIds: d.activityIds.filter((id) => id !== activityId) }
          : d
      )
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDays((prev) =>
      prev.map((d) => {
        if (!d.activityIds.includes(String(active.id))) return d;
        const oldIdx = d.activityIds.indexOf(String(active.id));
        const newIdx = d.activityIds.indexOf(String(over.id));
        if (newIdx === -1) return d;
        return { ...d, activityIds: arrayMove(d.activityIds, oldIdx, newIdx) };
      })
    );
  }

  const activeDay = days[activeDayIdx] ?? days[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 0 8px" }}>
      {/* Day tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 16px",
          overflowX: "auto",
          scrollbarWidth: "none",
          borderBottom: "1px solid var(--sand)",
        }}
      >
        {days.map((day, i) => (
          <button
            key={day.id}
            onClick={() => setActiveDayIdx(i)}
            style={{
              flexShrink: 0,
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              border: "2px solid var(--sand)",
              background: activeDayIdx === i ? "var(--sun)" : "transparent",
              color: activeDayIdx === i ? "white" : "var(--ink)",
              cursor: "pointer",
            }}
          >
            {day.label}
            {day.activityIds.length > 0 && (
              <span style={{ marginLeft: 6, opacity: 0.7 }}>({day.activityIds.length})</span>
            )}
          </button>
        ))}
        <button
          onClick={addDay}
          style={{
            flexShrink: 0,
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            border: "2px dashed var(--sand)",
            background: "transparent",
            color: "var(--sand)",
            cursor: "pointer",
          }}
        >
          + {tr.ui.add_day}
        </button>
      </div>

      {/* Activity list for active day */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {activeDay.activityIds.length === 0 ? (
          <div className="empty" style={{ paddingTop: 60 }}>
            📅<br />
            <span style={{ fontSize: 13 }}>
              Bættu við athöfnum í gegnum 🧭 Skoða flipann
            </span>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeDay.activityIds}
              strategy={verticalListSortingStrategy}
            >
              {activeDay.activityIds.map((actId) => (
                <SortableItem
                  key={actId}
                  id={actId}
                  activity={activities.find((a) => a.id === actId)}
                  lang={lang}
                  onRemove={() => removeActivity(activeDay.id, actId)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Summary bar */}
      {activeDay.activityIds.length > 0 && (
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--sand)",
            fontSize: 12,
            color: "#888",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{activeDay.activityIds.length} athafnir</span>
          <button
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 8,
              border: "1.5px solid var(--sand)",
              background: "transparent",
              cursor: "pointer",
              color: "var(--ink)",
            }}
            onClick={() => {
              const names = activeDay.activityIds
                .map((id) => activities.find((a) => a.id === id)?.name_en ?? id)
                .join("\n");
              navigator.clipboard?.writeText(`${activeDay.label}\n${names}`);
            }}
          >
            {tr.ui.export_day}
          </button>
        </div>
      )}
    </div>
  );
}
