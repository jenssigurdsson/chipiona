/**
 * Fixes over-translated place/restaurant names in activities.json.
 * Rule: name_is and name_en should keep the original Spanish name
 * if it's a proper noun (restaurant, bar, beach, landmark name).
 * Only description fields should be translated.
 */

import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const FILE = "data/activities.json";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

interface Activity {
  id: string;
  name: string;
  name_en: string;
  name_is: string;
  name_es: string;
  [key: string]: unknown;
}

const PROMPT = (activities: { id: string; name: string; name_en: string; name_is: string }[]) => `
You are reviewing translated place names for a travel app about Chipiona, Spain.

For each activity below, decide:
- If the name is a PROPER NOUN (restaurant name, bar name, beach name, landmark, brand name, person's name) → keep name_en and name_is equal to the original "name" field (the Spanish name). Do NOT translate proper nouns.
- If the name is a DESCRIPTIVE TITLE (e.g. "Coastal Walk", "Wine Tasting Tour") → keep the existing translation.

Return a JSON array with ONLY entries that need to be CHANGED, with fields: id, name_en, name_is.
If nothing needs changing for an entry, omit it entirely.

Activities:
${JSON.stringify(activities, null, 2)}

Return ONLY a valid JSON array. No markdown.`;

async function main() {
  const activities: Activity[] = JSON.parse(fs.readFileSync(FILE, "utf-8"));

  const input = activities.map(a => ({ id: a.id, name: a.name, name_en: a.name_en, name_is: a.name_is }));

  console.log(`Reviewing ${input.length} activity names...`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: PROMPT(input) }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "[]";
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const fixes: { id: string; name_en: string; name_is: string }[] = JSON.parse(stripped);

  console.log(`Found ${fixes.length} names to fix`);

  const fixMap = new Map(fixes.map(f => [f.id, f]));
  let changed = 0;

  const updated = activities.map(a => {
    const fix = fixMap.get(a.id);
    if (!fix) return a;
    console.log(`  ${a.id}: "${a.name_is}" → "${fix.name_is}"`);
    changed++;
    return { ...a, name_en: fix.name_en, name_is: fix.name_is };
  });

  fs.writeFileSync(FILE, JSON.stringify(updated, null, 2), "utf-8");
  fs.writeFileSync("public/activities.json", JSON.stringify(updated, null, 2), "utf-8");
  console.log(`\nFixed ${changed} names.`);
}

main().catch(e => { console.error(e); process.exit(1); });
