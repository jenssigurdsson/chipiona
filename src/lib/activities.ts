import type { Activity, Category } from "../types";

let cache: Activity[] | null = null;

export async function loadActivities(): Promise<Activity[]> {
  if (cache) return cache;
  const res = await fetch("/activities.json");
  cache = await res.json();
  return cache!;
}

const CATEGORY_ORDER = ["restaurant","beach","sightseeing","walking","sports","explore","other"];

export function filterActivities(
  activities: Activity[],
  opts: {
    category?: Category | "all";
    query?: string;
    priceRange?: string[];
    rentalOnly?: boolean;
    bestTime?: string;
  }
): Activity[] {
  return activities.filter((a) => {
    if (opts.category && opts.category !== "all" && a.category !== opts.category)
      return false;
    if (opts.query) {
      const q = opts.query.toLowerCase();
      if (
        !a.name.toLowerCase().includes(q) &&
        !a.name_en.toLowerCase().includes(q) &&
        !a.tags.some((t) => t.toLowerCase().includes(q))
      )
        return false;
    }
    if (opts.priceRange?.length && a.price_range && !opts.priceRange.includes(a.price_range))
      return false;
    if (opts.rentalOnly && !a.equipment_rental) return false;
    if (opts.bestTime && opts.bestTime !== "any" && a.best_time && a.best_time !== opts.bestTime)
      return false;
    return true;
  }).sort((a, b) =>
    CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );
}
