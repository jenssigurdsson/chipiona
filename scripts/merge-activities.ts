/**
 * Phase 1 — Deduplication & Merging
 * Merges pdf-activities.json + web-activities.json, deduplicates by name
 * similarity, and outputs the final data/activities.json.
 *
 * Output: data/activities.json
 */

import fs from "fs";
import path from "path";
import { distance } from "fastest-levenshtein";

const PDF_FILE = path.resolve("data/raw/pdf-activities.json");
const WEB_FILE = path.resolve("data/raw/web-activities.json");
const OUT_FILE = path.resolve("data/activities.json");

// ── Types ─────────────────────────────────────────────────────────────────────

interface Activity {
  id: string;
  name: string;
  name_en: string;
  name_is: string;
  name_es: string;
  category:
    | "walking"
    | "sightseeing"
    | "restaurant"
    | "explore"
    | "sports"
    | "beach"
    | "other";
  description_es: string;
  description_en: string;
  description_is: string;
  tags: string[];
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_range: "free" | "€" | "€€" | "€€€" | null;
  equipment_rental: boolean;
  best_time: "morning" | "afternoon" | "evening" | "any" | null;
  sources: string[];
  source_urls: (string | null)[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSimilar(a: string, b: string, threshold = 0.25): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return true;
  const d = distance(na, nb);
  return d / maxLen < threshold;
}

function slugify(name: string): string {
  return normalize(name).replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function mergeTwo(a: Activity, b: Activity): Activity {
  return {
    ...a,
    // Prefer longer, more detailed descriptions
    description_es:
      a.description_es.length >= b.description_es.length
        ? a.description_es
        : b.description_es,
    description_en:
      a.description_en.length >= b.description_en.length
        ? a.description_en
        : b.description_en,
    description_is:
      a.description_is.length >= b.description_is.length
        ? a.description_is
        : b.description_is,
    // Merge tags
    tags: [...new Set([...a.tags, ...b.tags])],
    // Prefer non-null values
    address: a.address ?? b.address,
    lat: a.lat ?? b.lat,
    lng: a.lng ?? b.lng,
    price_range: a.price_range ?? b.price_range,
    best_time: a.best_time ?? b.best_time,
    equipment_rental: a.equipment_rental || b.equipment_rental,
    // Merge sources
    sources: [...new Set([...a.sources, ...b.sources])],
    source_urls: [
      ...new Set([...a.source_urls, ...b.source_urls].filter(Boolean)),
    ],
  };
}

function loadRaw(filePath: string): Activity[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`  Missing: ${filePath} — skipping`);
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<
    string,
    unknown
  >[];
  return raw.map((r) => ({
    id: slugify(String(r.name ?? "")),
    name: String(r.name ?? ""),
    name_en: String(r.name_en ?? r.name ?? ""),
    name_is: String(r.name_is ?? r.name_en ?? r.name ?? ""),
    name_es: String(r.name_es ?? r.name ?? ""),
    category: (r.category as Activity["category"]) ?? "other",
    description_es: String(r.description_es ?? ""),
    description_en: String(r.description_en ?? ""),
    description_is: String(r.description_is ?? ""),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    address: r.address ? String(r.address) : null,
    lat: typeof r.lat === "number" ? r.lat : null,
    lng: typeof r.lng === "number" ? r.lng : null,
    price_range: (r.price_range as Activity["price_range"]) ?? null,
    equipment_rental: Boolean(r.equipment_rental),
    best_time: (r.best_time as Activity["best_time"]) ?? null,
    sources: [String(r.source ?? "unknown")],
    source_urls: [r.source_url ? String(r.source_url) : null],
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  console.log("Loading raw activity files...");
  const pdfActivities = loadRaw(PDF_FILE);
  const webActivities = loadRaw(WEB_FILE);
  console.log(
    `  PDF: ${pdfActivities.length} | Web: ${webActivities.length} raw items`
  );

  const all = [...pdfActivities, ...webActivities];
  const merged: Activity[] = [];

  for (const incoming of all) {
    if (!incoming.name.trim()) continue;

    const existingIdx = merged.findIndex((m) =>
      isSimilar(m.name, incoming.name)
    );

    if (existingIdx >= 0) {
      merged[existingIdx] = mergeTwo(merged[existingIdx], incoming);
    } else {
      merged.push({ ...incoming });
    }
  }

  // Ensure unique IDs
  const idCount: Record<string, number> = {};
  for (const item of merged) {
    idCount[item.id] = (idCount[item.id] ?? 0) + 1;
    if (idCount[item.id] > 1) {
      item.id = `${item.id}-${idCount[item.id]}`;
    }
  }

  // Sort: beaches first, then alphabetically by category
  const categoryOrder = [
    "beach",
    "sightseeing",
    "walking",
    "restaurant",
    "sports",
    "explore",
    "other",
  ];
  merged.sort(
    (a, b) =>
      categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) ||
      a.name.localeCompare(b.name, "es")
  );

  fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2), "utf-8");

  console.log(`\nMerged result:`);
  const counts = merged.reduce(
    (acc, a) => {
      acc[a.category] = (acc[a.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  for (const [cat, count] of Object.entries(counts)) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log(`  ─────────────`);
  console.log(`  Total: ${merged.length}`);
  console.log(`\nSaved to ${OUT_FILE}`);
}

main();
