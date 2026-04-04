/**
 * Fetches restaurant data for Chipiona specifically and merges into activities.json
 */

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const OUT_FILE = path.resolve("data/activities.json");
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const PROMPT = `You are a travel research assistant specializing in Andalucía, Spain.
List at least 15 real restaurants, chiringuitos, tapas bars, and seafood restaurants
in Chipiona (Cádiz province), Spain. Include well-known local spots.

For each return a JSON object:
{
  "name": "name in Spanish",
  "name_en": "English name or transliteration",
  "name_is": "Icelandic translation",
  "name_es": "Spanish name",
  "category": "restaurant",
  "description_es": "2-3 sentences in Spanish",
  "description_en": "2-3 sentences in English",
  "description_is": "2-3 sentences in Icelandic",
  "tags": ["tapas", "seafood", "chiringuito", "family", etc],
  "address": "address or null",
  "lat": null,
  "lng": null,
  "price_range": "free | € | €€ | €€€",
  "equipment_rental": false,
  "best_time": "morning | afternoon | evening | any",
  "sources": ["knowledge"],
  "source_urls": [null]
}

Return ONLY a valid JSON array. No markdown.`;

async function main() {
  console.log("Fetching restaurant data from Anthropic...");
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 6000,
    messages: [{ role: "user", content: PROMPT }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "[]";
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let restaurants: Record<string, unknown>[];
  try {
    restaurants = JSON.parse(stripped);
  } catch {
    // Truncated — find last complete object
    const lastComplete = stripped.lastIndexOf("},");
    if (lastComplete > 0) {
      restaurants = JSON.parse(stripped.slice(0, lastComplete + 1) + "]");
    } else {
      throw new Error("Could not parse response");
    }
  }
  console.log(`Got ${restaurants.length} restaurants`);

  // Add id and ensure sources field
  const withIds = restaurants.map((r) => ({
    ...r,
    id: String(r.name_en ?? r.name ?? "")
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, "-").trim(),
    sources: ["knowledge"],
    source_urls: [null],
  }));

  // Load existing, remove any already in restaurant category, merge
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, "utf-8")) as Record<string, unknown>[];

  // Fix Taberna El Chusco category while we're at it
  for (const item of existing) {
    if (String(item.name).includes("Chusco")) item.category = "restaurant";
  }

  // Deduplicate by id
  const existingIds = new Set(existing.map((a) => String(a.id)));
  const newOnes = withIds.filter((r) => !existingIds.has(String(r.id)));
  console.log(`Adding ${newOnes.length} new (${withIds.length - newOnes.length} duplicates skipped)`);

  const merged = [...existing, ...newOnes];

  fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2), "utf-8");
  fs.writeFileSync("public/activities.json", JSON.stringify(merged, null, 2), "utf-8");

  const cats: Record<string, number> = {};
  for (const a of merged) cats[String(a.category)] = (cats[String(a.category)] ?? 0) + 1;
  console.log("\nFinal categories:");
  for (const [k, v] of Object.entries(cats)) console.log(`  ${k}: ${v}`);
  console.log(`  Total: ${merged.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
