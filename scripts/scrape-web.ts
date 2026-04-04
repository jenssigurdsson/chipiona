/**
 * Phase 1 — Web Scraping & Social Listening
 * Fetches activity data from Reddit, local Spanish press, and TripAdvisor.
 * Uses Anthropic API to extract structured activities from each page.
 *
 * Output: data/raw/web-activities.json
 */

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const OUT_FILE = path.resolve("data/raw/web-activities.json");
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY in environment.");
  process.exit(1);
}

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ── Extraction prompt (same schema as extract-pdf) ───────────────────────────

const EXTRACTION_PROMPT = (source: string, sourceUrl: string) => `You are a travel research assistant. Analyze the following text about Chipiona,
Andalucía, Spain. Extract all activities, places, restaurants, and experiences mentioned.
For each item return a JSON object:

{
  "name": "string — name in original language",
  "name_en": "string — English translation",
  "name_is": "string — Icelandic translation",
  "name_es": "string — Spanish name",
  "category": "one of: walking | sightseeing | restaurant | explore | sports | beach | other",
  "description_es": "2-3 sentences in Spanish",
  "description_en": "2-3 sentences in English",
  "description_is": "2-3 sentences in Icelandic",
  "tags": ["relevant tags"],
  "address": "string or null",
  "lat": null,
  "lng": null,
  "price_range": "free | € | €€ | €€€ or null",
  "equipment_rental": false,
  "best_time": "morning | afternoon | evening | any or null",
  "source": "${source}",
  "source_url": "${sourceUrl}"
}

Return ONLY a valid JSON array. No markdown, no commentary. If there are no relevant activities, return [].`;

// ── Sources ───────────────────────────────────────────────────────────────────

const REDDIT_SEARCHES = [
  "Chipiona",
  "Chipiona Andalucia",
  "Chipiona Spain things to do",
];

const PRESS_URLS = [
  "https://turismo.chipiona.es/que-ver",
  "https://www.andalucia.org/es/chipiona",
  "https://www.tripadvisor.es/Attractions-g580267-Activities-Chipiona_Costa_de_la_Luz_Province_of_Cadiz_Andalucia.html",
  "https://www.diariodecadiz.es/search/?q=chipiona+turismo",
  "https://www.europasur.es/search/?q=chipiona+que+hacer",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ChipionaGuideBot/1.0; research only)",
      Accept: "text/html,application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function extractActivities(
  text: string,
  source: string,
  sourceUrl: string
): Promise<unknown[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${EXTRACTION_PROMPT(source, sourceUrl)}\n\n--- TEXT ---\n${text.slice(0, 40000)}`,
      },
    ],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "[]";
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]);
    return [];
  }
}

// ── Reddit ────────────────────────────────────────────────────────────────────

async function scrapeReddit(): Promise<unknown[]> {
  const all: unknown[] = [];
  const subreddits = ["spain", "andalucia", "travel", "solotravel"];

  for (const query of REDDIT_SEARCHES) {
    for (const sub of subreddits) {
      const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&limit=5`;
      try {
        const text = await fetchUrl(url);
        const json = JSON.parse(text);
        const posts: string[] = [];

        for (const post of json?.data?.children ?? []) {
          const d = post.data;
          const content = `${d.title}\n${d.selftext ?? ""}`.trim();
          if (content.toLowerCase().includes("chipiona")) {
            posts.push(content);
          }
        }

        if (posts.length > 0) {
          console.log(
            `  reddit r/${sub} "${query}" → ${posts.length} relevant posts`
          );
          const combined = posts.join("\n\n---\n\n");
          const activities = await extractActivities(
            combined,
            "reddit",
            `https://www.reddit.com/r/${sub}/search?q=${encodeURIComponent(query)}`
          );
          all.push(...activities);
        }

        await sleep(1500);
      } catch (err) {
        console.warn(`  reddit r/${sub} "${query}" failed: ${err}`);
      }
    }
  }

  return all;
}

// ── Press / web pages ─────────────────────────────────────────────────────────

async function scrapePressUrls(): Promise<unknown[]> {
  const all: unknown[] = [];

  for (const url of PRESS_URLS) {
    try {
      console.log(`  Fetching: ${url}`);
      const html = await fetchUrl(url);
      // Strip HTML tags for a rough plain-text extraction
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

      const activities = await extractActivities(text, "press", url);
      console.log(`    → ${activities.length} activities`);
      all.push(...activities);
      await sleep(2000);
    } catch (err) {
      console.warn(`  Failed: ${url} — ${err}`);
    }
  }

  return all;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  const all: unknown[] = [];

  console.log("\n── Reddit ──────────────────────────────────────────────────");
  const redditActivities = await scrapeReddit();
  console.log(`Reddit total: ${redditActivities.length} activities`);
  all.push(...redditActivities);

  console.log("\n── Press & web ─────────────────────────────────────────────");
  const pressActivities = await scrapePressUrls();
  console.log(`Press total: ${pressActivities.length} activities`);
  all.push(...pressActivities);

  fs.writeFileSync(OUT_FILE, JSON.stringify(all, null, 2), "utf-8");
  console.log(`\nDone. ${all.length} raw activities saved to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
