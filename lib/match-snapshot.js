import fs from "node:fs/promises";
import path from "node:path";

const DATA_FILE = path.join(process.cwd(), "data", "scraped-matches.json");

export async function getMatchSnapshot() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data?.matches) ? data.matches : [];
  } catch {
    return [];
  }
}

export async function getMatchSnapshotMeta() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    return {
      updatedAt: data?.updatedAt || null,
      leagues: Array.isArray(data?.leagues) ? data.leagues : [],
      counts: data?.counts || {},
      currentLeagueCount: Number(data?.currentLeagueCount || 0),
      catalogLeagueCount: Number(data?.catalogLeagueCount || 0),
    };
  } catch {
    return { updatedAt: null, leagues: [], counts: {}, currentLeagueCount: 0, catalogLeagueCount: 0 };
  }
}

export async function getMatchSnapshotStatus() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    return {
      updatedAt: data?.updatedAt || null,
      count: Array.isArray(data?.matches) ? data.matches.length : 0,
      source: data?.source || null,
    };
  } catch {
    return { updatedAt: null, count: 0, source: null };
  }
}
