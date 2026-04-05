/**
 * Quality review for activities.json.
 * Uses Claude to identify activities that should be removed or fixed:
 * - Not located in Chipiona (e.g. Isla Cristina, Bolonia, Doñana day trips)
 * - Duplicates
 * - Wrong category
 * - Too little useful information
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
  category: string;
  description_en: string;
  tags: string[];
  address: string | null;
  [key: string]: unknown;
}

interface ReviewResult {
  id: string;
  action: "keep" | "remove" | "fix_category";
  reason: string;
  new_category?: string;
}

const PROMPT = (activities: { id: string; name: string; category: string; description_en: string; address: string | null }[]) => `
You are reviewing activities for a travel guide app about Chipiona, a small coastal town in Cádiz province, Andalucía, Spain (population ~19,000).

Chipiona is known for: its lighthouse (Faro de Chipiona), beaches (Playa de Regla, Playa Cruz del Mar, etc.), seafood restaurants, fishing, the Sanctuary of Nuestra Señora de Regla, its local wine (Moscatel), and the promenade.

For each activity below, decide:
- "remove": The activity is NOT in or directly part of Chipiona itself. This includes:
  * Other towns (Isla Cristina, Bolonia, Rota, Sanlúcar, Jerez, Cádiz, etc.)
  * National parks that are not within walking/cycling distance of Chipiona
  * Activities with so little info they add no value
- "fix_category": The activity is in Chipiona but is in the wrong category
- "keep": Everything looks good

Categories available: restaurant, beach, sightseeing, walking, sports, explore, other

Return a JSON array with ALL entries. Fields: id, action, reason, new_category (only if fix_category).

Activities:
${JSON.stringify(activities, null, 2)}

Return ONLY a valid JSON array. No markdown.`;

async function main() {
  const activities: Activity[] = JSON.parse(fs.readFileSync(FILE, "utf-8"));

  const input = activities.map(a => ({
    id: a.id,
    name: a.name,
    category: a.category,
    description_en: a.description_en,
    address: a.address,
  }));

  console.log(`Reviewing ${input.length} activities...`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    messages: [{ role: "user", content: PROMPT(input) }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "[]";
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const results: ReviewResult[] = JSON.parse(stripped);

  const toRemove = results.filter(r => r.action === "remove");
  const toFix = results.filter(r => r.action === "fix_category");

  console.log(`\n📋 Review summary:`);
  console.log(`  Remove:       ${toRemove.length}`);
  console.log(`  Fix category: ${toFix.length}`);
  console.log(`  Keep:         ${results.filter(r => r.action === "keep").length}`);

  if (toRemove.length > 0) {
    console.log(`\n🗑️  To remove:`);
    for (const r of toRemove) {
      console.log(`  [${r.id}] ${r.reason}`);
    }
  }

  if (toFix.length > 0) {
    console.log(`\n🔧 Category fixes:`);
    for (const r of toFix) {
      const a = activities.find(x => x.id === r.id);
      console.log(`  [${r.id}] ${a?.category} → ${r.new_category} (${r.reason})`);
    }
  }

  const removeIds = new Set(toRemove.map(r => r.id));
  const fixMap = new Map(toFix.map(r => [r.id, r.new_category!]));

  const updated = activities
    .filter(a => !removeIds.has(a.id))
    .map(a => fixMap.has(a.id) ? { ...a, category: fixMap.get(a.id)! } : a);

  fs.writeFileSync(FILE, JSON.stringify(updated, null, 2), "utf-8");
  fs.writeFileSync("public/activities.json", JSON.stringify(updated, null, 2), "utf-8");

  console.log(`\n✅ Done. ${activities.length} → ${updated.length} activities.`);
}

main().catch(e => { console.error(e); process.exit(1); });
