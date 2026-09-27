import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import { chromium } from "playwright";

const BASE = "https://www.flashscore.com";
const OUTPUT = path.join(process.cwd(), "data", "scraped-matches.json");
const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ||
  "MatchZone/1.0 (+https://matchzone-live.vercel.app/)";

const LEAGUES = [
  ["england-premier-league", "https://www.flashscore.com/football/england/premier-league/"],
  ["england-championship", "https://www.flashscore.com/football/england/championship/"],
  ["spain-laliga", "https://www.flashscore.com/football/spain/laliga/"],
  ["spain-segunda", "https://www.flashscore.com/football/spain/laliga2/"],
  ["italy-serie-a", "https://www.flashscore.com/football/italy/serie-a/"],
  ["italy-serie-b", "https://www.flashscore.com/football/italy/serie-b/"],
  ["germany-bundesliga", "https://www.flashscore.com/football/germany/bundesliga/"],
  ["germany-2-bundesliga", "https://www.flashscore.com/football/germany/2-bundesliga/"],
  ["france-ligue-1", "https://www.flashscore.com/football/france/ligue-1/"],
  ["france-ligue-2", "https://www.flashscore.com/football/france/ligue-2/"],
  ["netherlands-eredivisie", "https://www.flashscore.com/football/netherlands/eredivisie/"],
  ["portugal-liga-portugal", "https://www.flashscore.com/football/portugal/liga-portugal/"],
  ["belgium-jupiler", "https://www.flashscore.com/football/belgium/jupiler-pro-league/"],
  ["scotland-premiership", "https://www.flashscore.com/football/scotland/premiership/"],
  ["turkey-super-lig", "https://www.flashscore.com/football/turkey/super-lig/"],
  ["greece-super-league", "https://www.flashscore.com/football/greece/super-league/"],
  ["austria-bundesliga", "https://www.flashscore.com/football/austria/bundesliga/"],
  ["switzerland-super-league", "https://www.flashscore.com/football/switzerland/super-league/"],
  ["denmark-superliga", "https://www.flashscore.com/football/denmark/superliga/"],
  ["norway-eliteserien", "https://www.flashscore.com/football/norway/eliteserien/"],
  ["sweden-allsvenskan", "https://www.flashscore.com/football/sweden/allsvenskan/"],
  ["poland-ekstraklasa", "https://www.flashscore.com/football/poland/ekstraklasa/"],
  ["czech-first-league", "https://www.flashscore.com/football/czech-republic/chance-liga/"],
  ["croatia-hnl", "https://www.flashscore.com/football/croatia/hnl/"],
  ["serbia-super-liga", "https://www.flashscore.com/football/serbia/super-liga/"],
  ["romania-superliga", "https://www.flashscore.com/football/romania/superliga/"],
  ["ukraine-premier-league", "https://www.flashscore.com/football/ukraine/premier-league/"],
  ["russia-premier-league", "https://www.flashscore.com/football/russia/premier-league/"],
  ["usa-mls", "https://www.flashscore.com/football/usa/mls/"],
  ["mexico-liga-mx", "https://www.flashscore.com/football/mexico/liga-mx/"],
  ["brazil-serie-a", "https://www.flashscore.com/football/brazil/serie-a/"],
  ["brazil-serie-b", "https://www.flashscore.com/football/brazil/serie-b/"],
  ["argentina-liga-profesional", "https://www.flashscore.com/football/argentina/liga-profesional/"],
  ["colombia-primera-a", "https://www.flashscore.com/football/colombia/primera-a/"],
  ["chile-primera", "https://www.flashscore.com/football/chile/primera-division/"],
  ["ecuador-ligapro", "https://www.flashscore.com/football/ecuador/liga-pro/"],
  ["uruguay-primera", "https://www.flashscore.com/football/uruguay/primera-division/"],
  ["saudi-pro-league", "https://www.flashscore.com/football/saudi-arabia/saudi-professional-league/"],
  ["uae-pro-league", "https://www.flashscore.com/football/united-arab-emirates/uae-league/"],
  ["qatar-stars-league", "https://www.flashscore.com/football/qatar/qsl/"],
  ["japan-j1-league", "https://www.flashscore.com/football/japan/j1-league/"],
  ["south-korea-k-league-1", "https://www.flashscore.com/football/south-korea/k-league-1/"],
  ["australia-a-league", "https://www.flashscore.com/football/australia/a-league/"],
  ["morocco-botola", "https://www.flashscore.com/football/morocco/botola-pro/"],
  ["egypt-premier-league", "https://www.flashscore.com/football/egypt/premier-league/"],
  ["south-africa-premiership", "https://www.flashscore.com/football/south-africa/premiership/"],
  ["champions-league", "https://www.flashscore.com/football/europe/champions-league/"],
  ["europa-league", "https://www.flashscore.com/football/europe/europa-league/"],
  ["conference-league", "https://www.flashscore.com/football/europe/europa-conference-league/"],
  ["copa-libertadores", "https://www.flashscore.com/football/south-america/copa-libertadores/"],
  ["caf-champions-league", "https://www.flashscore.com/football/africa/caf-champions-league/"],
  ["afc-champions-league", "https://www.flashscore.com/football/asia/afc-champions-league-elite/"],
];


const FEED_HOSTS = [
  "https://local-global.flashscore.ninja/2/x/feed",
  "https://2.flashscore.ninja/2/x/feed",
];

const FEED_DAYS = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7];

const LEAGUES = [
  ["england-premier-league", "https://www.flashscore.com/football/england/premier-league/"],
  ["england-championship", "https://www.flashscore.com/football/england/championship/"],
  ["spain-laliga", "https://www.flashscore.com/football/spain/laliga/"],
  ["spain-segunda", "https://www.flashscore.com/football/spain/laliga2/"],
  ["italy-serie-a", "https://www.flashscore.com/football/italy/serie-a/"],
  ["italy-serie-b", "https://www.flashscore.com/football/italy/serie-b/"],
  ["germany-bundesliga", "https://www.flashscore.com/football/germany/bundesliga/"],
  ["germany-2-bundesliga", "https://www.flashscore.com/football/germany/2-bundesliga/"],
  ["france-ligue-1", "https://www.flashscore.com/football/france/ligue-1/"],
  ["france-ligue-2", "https://www.flashscore.com/football/france/ligue-2/"],
  ["netherlands-eredivisie", "https://www.flashscore.com/football/netherlands/eredivisie/"],
  ["portugal-liga-portugal", "https://www.flashscore.com/football/portugal/liga-portugal/"],
  ["belgium-jupiler", "https://www.flashscore.com/football/belgium/jupiler-pro-league/"],
  ["scotland-premiership", "https://www.flashscore.com/football/scotland/premiership/"],
  ["turkey-super-lig", "https://www.flashscore.com/football/turkey/super-lig/"],
  ["greece-super-league", "https://www.flashscore.com/football/greece/super-league/"],
  ["austria-bundesliga", "https://www.flashscore.com/football/austria/bundesliga/"],
  ["switzerland-super-league", "https://www.flashscore.com/football/switzerland/super-league/"],
  ["denmark-superliga", "https://www.flashscore.com/football/denmark/superliga/"],
  ["norway-eliteserien", "https://www.flashscore.com/football/norway/eliteserien/"],
  ["sweden-allsvenskan", "https://www.flashscore.com/football/sweden/allsvenskan/"],
  ["poland-ekstraklasa", "https://www.flashscore.com/football/poland/ekstraklasa/"],
  ["czech-first-league", "https://www.flashscore.com/football/czech-republic/chance-liga/"],
  ["croatia-hnl", "https://www.flashscore.com/football/croatia/hnl/"],
  ["serbia-super-liga", "https://www.flashscore.com/football/serbia/super-liga/"],
  ["romania-superliga", "https://www.flashscore.com/football/romania/superliga/"],
  ["ukraine-premier-league", "https://www.flashscore.com/football/ukraine/premier-league/"],
  ["russia-premier-league", "https://www.flashscore.com/football/russia/premier-league/"],
  ["usa-mls", "https://www.flashscore.com/football/usa/mls/"],
  ["mexico-liga-mx", "https://www.flashscore.com/football/mexico/liga-mx/"],
  ["brazil-serie-a", "https://www.flashscore.com/football/brazil/serie-a/"],
  ["brazil-serie-b", "https://www.flashscore.com/football/brazil/serie-b/"],
  ["argentina-liga-profesional", "https://www.flashscore.com/football/argentina/liga-profesional/"],
  ["colombia-primera-a", "https://www.flashscore.com/football/colombia/primera-a/"],
  ["chile-primera", "https://www.flashscore.com/football/chile/primera-division/"],
  ["ecuador-ligapro", "https://www.flashscore.com/football/ecuador/liga-pro/"],
  ["uruguay-primera", "https://www.flashscore.com/football/uruguay/primera-division/"],
  ["saudi-pro-league", "https://www.flashscore.com/football/saudi-arabia/saudi-professional-league/"],
  ["uae-pro-league", "https://www.flashscore.com/football/united-arab-emirates/uae-league/"],
  ["qatar-stars-league", "https://www.flashscore.com/football/qatar/qsl/"],
  ["japan-j1-league", "https://www.flashscore.com/football/japan/j1-league/"],
  ["south-korea-k-league-1", "https://www.flashscore.com/football/south-korea/k-league-1/"],
  ["australia-a-league", "https://www.flashscore.com/football/australia/a-league/"],
  ["morocco-botola", "https://www.flashscore.com/football/morocco/botola-pro/"],
  ["egypt-premier-league", "https://www.flashscore.com/football/egypt/premier-league/"],
  ["south-africa-premiership", "https://www.flashscore.com/football/south-africa/premiership/"],
  ["champions-league", "https://www.flashscore.com/football/europe/champions-league/"],
  ["europa-league", "https://www.flashscore.com/football/europe/europa-league/"],
  ["conference-league", "https://www.flashscore.com/football/europe/europa-conference-league/"],
  ["copa-libertadores", "https://www.flashscore.com/football/south-america/copa-libertadores/"],
  ["caf-champions-league", "https://www.flashscore.com/football/africa/caf-champions-league/"],
  ["afc-champions-league", "https://www.flashscore.com/football/asia/afc-champions-league-elite/"],
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(fc|cf|sc|afc|ac|club)\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function parseFeed(text) {
  const rows = [];
  let currentTournament = null;

  for (const block of String(text || "").split("~")) {
    const record = {};
    for (const cell of block.split("¬")) {
      const index = cell.indexOf("÷");
      if (index <= 0) continue;
      record[cell.slice(0, index)] = cell.slice(index + 1);
    }

    if (record.ZL) {
      currentTournament = {
        name: record.ZA || record.AC || "",
        path: record.ZL,
        country: record.ZY || "",
      };
      continue;
    }

    if (!record.AA || !record.AE || !record.AF) continue;

    rows.push({
      ...record,
      tournament: currentTournament,
    });
  }

  return rows;
}

function pathForLeague(url) {
  return new URL(url).pathname;
}

function statusFromCode(code) {
  if (code === "3") return "FT";
  if (code === "2") return "LIVE";
  return "NS";
}

function matchFromFeed(record, leagueKey, sourcePath) {
  const timestamp = Number(record.AD || 0);
  const date = timestamp > 0 ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();
  const homeScore = record.AG === undefined || record.AG === "" ? null : Number(record.AG);
  const awayScore = record.AH === undefined || record.AH === "" ? null : Number(record.AH);
  const status = statusFromCode(record.AB);

  return {
    fixture: {
      id: "fs-" + record.AA,
      date,
      status: { short: status },
    },
    teams: {
      home: { id: record.AU || null, name: record.AE, logo: null },
      away: { id: record.AV || null, name: record.AF, logo: null },
    },
    goals: {
      home: Number.isFinite(homeScore) ? homeScore : null,
      away: Number.isFinite(awayScore) ? awayScore : null,
    },
    league: {
      id: "flashscore-" + leagueKey,
      name: record.tournament?.name || leagueKey,
      logo: null,
    },
    source: "Flashscore Feed",
    sources: ["Flashscore Feed"],
    externalId: record.AA,
    externalIds: { "Flashscore Feed": record.AA },
    sourceUrl: "https://www.flashscore.com/match/" + record.AA + "/",
    sourcePath,
  };
}

async function fetchFeed(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.flashscore.com/",
      Origin: "https://www.flashscore.com",
      "x-fsign": "SW9D1eZo",
      "x-requested-with": "XMLHttpRequest",
      "x-referer": "https://www.flashscore.com/",
      "x-geoip": "1",
      Pragma: "no-cache",
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error("feed HTTP " + response.status);
  }

  const text = await response.text();
  if (!text || text.length < 100) {
    throw new Error("feed returned an empty/short payload");
  }

  return text;
}

async function scrapeInternalFeed() {
  const wanted = new Map(
    LEAGUES.map(([leagueKey, url]) => [pathForLeague(url), { leagueKey, url }])
  );
  const collected = [];

  for (const day of FEED_DAYS) {
    let loaded = false;

    for (const host of FEED_HOSTS) {
      const endpoint = host + "/f_1_" + day + "_3_en_1";
      try {
        const raw = await fetchFeed(endpoint);
        const rows = parseFeed(raw);
        let found = 0;

        for (const row of rows) {
          const path = row.tournament?.path;
          const league = wanted.get(path);
          if (!league) continue;
          collected.push(matchFromFeed(row, league.leagueKey, path));
          found += 1;
        }

        console.log("[scraper] feed day", day, "loaded", rows.length, "rows; matched", found);
        loaded = true;
        break;
      } catch (error) {
        console.warn("[scraper] feed failed", endpoint, error.message);
      }
    }

    if (!loaded) {
      console.warn("[scraper] all feed hosts failed for day", day);
    }

    await sleep(1200);
  }

  return collected;
}

function dedupe(matches) {
  const byId = new Map();
  const byFixture = new Map();

  for (const match of matches) {
    const id = String(match.fixture?.id || "");
    const fixtureKey = [
      match.fixture?.date?.slice(0, 10),
      normalizeName(match.teams?.home?.name),
      normalizeName(match.teams?.away?.name),
    ].join("|");

    if (byId.has(id)) continue;
    if (byFixture.has(fixtureKey)) {
      const existing = byFixture.get(fixtureKey);
      if (existing.fixture.status.short !== "FT" && match.fixture.status.short === "FT") {
        byId.delete(existing.fixture.id);
        byId.set(id, match);
        byFixture.set(fixtureKey, match);
      }
      continue;
    }

    byId.set(id, match);
    byFixture.set(fixtureKey, match);
  }

  return Array.from(byId.values());
}

async function main() {
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });

  let previous = { updatedAt: null, source: "flashscore-feed", matches: [] };
  try {
    previous = JSON.parse(await fs.readFile(OUTPUT, "utf8"));
  } catch {}

  let scraped = [];
  try {
    scraped = await scrapeInternalFeed();
  } catch (error) {
    console.warn("[scraper] internal feed failed:", error.message);
  }

  if (scraped.length === 0) {
    console.warn("[scraper] internal feed returned 0 matches. Keeping the previous datastore intact.");
  }

  const merged = dedupe([...(previous.matches || []), ...scraped]).slice(-5000);

  const payload = {
    updatedAt: new Date().toISOString(),
    source: scraped.some((m) => m.source === "Flashscore Feed") ? "flashscore-feed" : "flashscore-html",
    leagueCount: LEAGUES.length,
    matchCount: merged.length,
    matches: merged,
  };

  await fs.writeFile(OUTPUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log("[scraper] saved", merged.length, "unique matches from", LEAGUES.length, "competitions");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
