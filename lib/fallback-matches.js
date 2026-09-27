import fs from "node:fs/promises";
import path from "node:path";

const DATA_PATH = path.join(process.cwd(), "data", "scraped-matches.json");
const MAX_AGE_MS = 1000 * 60 * 60 * 48;

export async function getFallbackMatches({ maxAgeMs = MAX_AGE_MS } = {}) {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const data = JSON.parse(raw);
    const updatedAt = data?.updatedAt ? new Date(data.updatedAt).getTime() : 0;
    if (!updatedAt || Date.now() - updatedAt > maxAgeMs) return [];
    return Array.isArray(data?.matches) ? data.matches : [];
  } catch (error) {
    console.error("Fallback datastore error:", error);
    return [];
  }
}

export async function getFallbackStatus() {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const data = JSON.parse(raw);
    return {
      updatedAt: data?.updatedAt || null,
      count: Array.isArray(data?.matches) ? data.matches.length : 0,
    };
  } catch {
    return { updatedAt: null, count: 0 };
  }
}
