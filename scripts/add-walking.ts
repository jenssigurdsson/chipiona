import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }
const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const PROMPT = `List at least 10 real walking routes, coastal paths, nature walks, and town strolls
in and around Chipiona (Cádiz), Andalucía, Spain. Include the Paseo Marítimo, routes along
the beaches, the Via Verde greenway, and any known nature trails nearby.

For each return:
{
  "name": "Spanish name",
  "name_en": "English name",
  "name_is": "Icelandic name",
  "name_es": "Spanish name",
  "category": "walking",
  "description_es": "2-3 sentences in Spanish",
  "description_en": "2-3 sentences in English",
  "description_is": "2-3 sentences in Icelandic",
  "tags": ["coastal","family","free","nature", etc],
  "address": null,
  "lat": null, "lng": null,
  "price_range": "free",
  "equipment_rental": false,
  "best_time": "morning | afternoon | evening | any",
  "sources": ["knowledge"],
  "source_urls": [null]
}

Return ONLY a valid JSON array. No markdown.`;

async function main() {
  console.log("Fetching walking routes...");
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 5000,
    messages: [{ role: "user", content: PROMPT }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "[]";
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let items: Record<string, unknown>[];
  try {
    items = JSON.parse(stripped);
  } catch {
    const last = stripped.lastIndexOf("},");
    items = JSON.parse(stripped.slice(0, last + 1) + "]");
  }

  console.log(`Got ${items.length} walking routes`);

  const withIds = items.map((r) => ({
    ...r,
    id: String(r.name_en ?? r.name ?? "")
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, "-").trim(),
  }));

  const existing = JSON.parse(fs.readFileSync("data/activities.json", "utf-8")) as Record<string, unknown>[];
  const existingIds = new Set(existing.map((a) => String(a.id)));
  const newOnes = withIds.filter((r) => !existingIds.has(String(r.id)));
  const merged = [...existing, ...newOnes];

  fs.writeFileSync("data/activities.json", JSON.stringify(merged, null, 2), "utf-8");
  fs.writeFileSync("public/activities.json", JSON.stringify(merged, null, 2), "utf-8");

  const cats: Record<string, number> = {};
  for (const a of merged) cats[String(a.category)] = (cats[String(a.category)] ?? 0) + 1;
  console.log("Categories:", cats);
  console.log("Total:", merged.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
