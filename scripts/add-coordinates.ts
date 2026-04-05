/**
 * Adds GPS coordinates to activities using Nominatim (OpenStreetMap).
 * Searches by activity name + "Chipiona, Spain".
 * Rate-limited to 1 request/second per Nominatim policy.
 */

import fs from "fs";

const FILE = "data/activities.json";

interface Activity {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  [key: string]: unknown;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=es`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ChipionaGuideApp/1.0 (personal travel app)" },
  });
  const data: NominatimResult[] = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const activities: Activity[] = JSON.parse(fs.readFileSync(FILE, "utf-8"));
  const missing = activities.filter((a) => !a.lat);
  console.log(`Geocoding ${missing.length} activities...\n`);

  let found = 0;
  let notFound = 0;

  for (const activity of activities) {
    if (activity.lat) continue;

    // Try name + Chipiona first, then address + Chipiona, then name alone in Chipiona area
    const queries = [
      `${activity.name}, Chipiona, Cádiz, Spain`,
      activity.address ? `${activity.address}, Chipiona, Spain` : null,
      `${activity.name}, Cádiz, Spain`,
    ].filter(Boolean) as string[];

    let result = null;
    for (const q of queries) {
      result = await geocode(q);
      await sleep(1100); // Nominatim rate limit: max 1 req/sec
      if (result) break;
    }

    if (result) {
      // Sanity check: must be within ~20km of Chipiona (36.7333, -6.4167)
      const dlat = Math.abs(result.lat - 36.7333);
      const dlng = Math.abs(result.lng - (-6.4167));
      if (dlat < 0.3 && dlng < 0.3) {
        activity.lat = result.lat;
        activity.lng = result.lng;
        console.log(`  ✓ ${activity.name}: ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`);
        found++;
      } else {
        console.log(`  ✗ ${activity.name}: result too far away (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})`);
        notFound++;
      }
    } else {
      console.log(`  ? ${activity.name}: not found`);
      notFound++;
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(activities, null, 2), "utf-8");
  fs.writeFileSync("public/activities.json", JSON.stringify(activities, null, 2), "utf-8");
  console.log(`\nFound: ${found}, Not found: ${notFound}`);
}

main().catch(e => { console.error(e); process.exit(1); });
