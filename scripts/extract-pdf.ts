/**
 * Phase 1 — PDF Extraction
 * Sends PDFs directly to the Anthropic API (native PDF support via base64).
 * No OCR or text extraction needed — Claude reads the PDF visually.
 *
 * Output: data/raw/pdf-activities.json
 */

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const PDF_DIR = path.resolve("data/pdfs");
const OUT_FILE = path.resolve("data/raw/pdf-activities.json");
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY in environment.");
  process.exit(1);
}

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `You are a travel research assistant. Analyze this PDF about Chipiona,
Andalucía, Spain. Extract ALL activities, places, restaurants, beaches, monuments, sports,
bodegas, and experiences mentioned.

For each item return a JSON object with these exact fields:

{
  "name": "name in original language",
  "name_en": "English translation",
  "name_is": "Icelandic translation",
  "name_es": "Spanish name",
  "category": "one of: walking | sightseeing | restaurant | explore | sports | beach | other",
  "description_es": "2-3 sentence description in Spanish",
  "description_en": "2-3 sentence description in English",
  "description_is": "2-3 sentence description in Icelandic",
  "tags": ["relevant tags, e.g. 'free', 'family', 'sunset', 'rental', 'seafood', 'wine'"],
  "address": "address string or null",
  "lat": null,
  "lng": null,
  "price_range": "free | € | €€ | €€€ or null",
  "equipment_rental": false,
  "best_time": "morning | afternoon | evening | any or null",
  "source": "pdf",
  "source_url": null
}

Return ONLY a valid JSON array. No markdown, no commentary.`;

async function extractFromPdf(filePath: string): Promise<unknown[]> {
  const pdfBuffer = fs.readFileSync(filePath);
  const base64 = pdfBuffer.toString("base64");

  console.log(`  → Sending to Anthropic API (${Math.round(pdfBuffer.length / 1024)} KB)...`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";

  // Strip optional ```json ... ``` wrapping
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  // If response was truncated mid-JSON, find the last complete object
  function parseWithFallback(s: string): unknown[] {
    try {
      return JSON.parse(s);
    } catch {
      // Find last complete object by trimming to last "},"
      const lastComplete = s.lastIndexOf("},");
      if (lastComplete > 0) {
        try {
          return JSON.parse(s.slice(0, lastComplete + 1) + "]");
        } catch { /* fall through */ }
      }
      throw new Error("Could not parse response as JSON:\n" + s.slice(0, 300));
    }
  }

  return parseWithFallback(stripped);
}

async function main() {
  fs.mkdirSync(PDF_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  const pdfFiles = fs
    .readdirSync(PDF_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));

  if (pdfFiles.length === 0) {
    console.log(`No PDFs found in ${PDF_DIR}. Add PDFs and re-run.`);
    process.exit(0);
  }

  const allActivities: unknown[] = [];

  for (const file of pdfFiles) {
    console.log(`\nProcessing: ${file}`);
    const activities = await extractFromPdf(path.join(PDF_DIR, file));
    console.log(`  → Got ${activities.length} activities`);
    allActivities.push(...activities);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(allActivities, null, 2), "utf-8");
  console.log(`\nDone. ${allActivities.length} activities saved to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
