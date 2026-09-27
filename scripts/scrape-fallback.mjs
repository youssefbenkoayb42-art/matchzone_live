import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

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

function parseDateTime(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const match = text.match(/(\d{1,2})\.(\d{1,2})\.\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const [, day, month, hour, minute] = match;
    const now = new Date();
    const year = now.getFullYear();
    const date = new Date(Date.UTC(year, Number(month) - 1, Number(day), Number(hour), Number(minute)));
    return date.toISOString();
  }
  const timeOnly = text.match(/^(\d{1,2}):(\d{2})$/);
  if (timeOnly) {
    const now = new Date();
    now.setUTCHours(Number(timeOnly[1]), Number(timeOnly[2]), 0, 0);
    return now.toISOString();
  }
  return new Date().toISOString();
}

function numericScore(value) {
  const n = Number(String(value || "").replace(/[^0-9-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function extractMatches(html, leagueKey, sourceUrl) {
  const $ = cheerio.load(html);
  const matches = [];

  $(".event__match").each((_, element) => {
    const row = $(element);
    const id =
      row.attr("id")?.replace(/^g_1_/, "") ||
      row.attr("data-event-id") ||
      row.find("[data-event-id]").first().attr("data-event-id");

    const participants = row.find(".event__participant").map((__, node) => $(node).text().trim()).get();
    const scores = row.find(".event__score").map((__, node) => $(node).text().trim()).get();
    const time = row.find(".event__time").first().text().trim();
    const statusText = row.find(".event__stage").first().text().trim().toUpperCase();
    const href = row.find("a").first().attr("href") || "";

    if (!participants[0] || !participants[1]) return;

    const homeScore = numericScore(scores[0]);
    const awayScore = numericScore(scores[1]);
    const finished =
      /FT|FINISHED|AET|PEN/.test(statusText) ||
      (homeScore !== null && awayScore !== null && !/\d{1,2}:\d{2}/.test(time));

    const date = parseDateTime(time);
    const stableId =
      id ||
      "fallback-" +
        Buffer.from(
          [date.slice(0, 10), normalizeName(participants[0]), normalizeName(participants[1])].join("|")
        ).toString("base64url");

    matches.push({
      fixture: {
        id: "fs-" + stableId,
        date,
        status: { short: finished ? "FT" : "NS" },
      },
      teams: {
        home: { id: null, name: participants[0], logo: null },
        away: { id: null, name: participants[1], logo: null },
      },
      goals: { home: homeScore, away: awayScore },
      league: { id: "flashscore-" + leagueKey, name: leagueKey, logo: null },
      source: "Flashscore HTML",
      sources: ["Flashscore HTML"],
      externalId: stableId,
      externalIds: { "Flashscore HTML": stableId },
      sourceUrl: new URL(href || sourceUrl, BASE).toString(),
    });
  });

  return matches;
}

async function fetchLeague(leagueKey, url) {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
  };

  const urls = [url, `${url}results/`];
  const all = [];

  for (const target of urls) {
    try {
      const response = await fetch(target, { headers });
      if (!response.ok) {
        console.warn("[scraper]", leagueKey, response.status, target);
        continue;
      }
      const html = await response.text();
      all.push(...extractMatches(html, leagueKey, target));
    } catch (error) {
      console.warn("[scraper]", leagueKey, error.message);
    }
    await sleep(900);
  }

  return all;
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

  let previous = { updatedAt: null, source: "flashscore-html", matches: [] };
  try {
    previous = JSON.parse(await fs.readFile(OUTPUT, "utf8"));
  } catch {}

  const scraped = [];
  for (const [leagueKey, url] of LEAGUES) {
    console.log("[scraper] fetching", leagueKey);
    scraped.push(...(await fetchLeague(leagueKey, url)));
  }

  const merged = dedupe([...(previous.matches || []), ...scraped]).slice(-5000);

  const payload = {
    updatedAt: new Date().toISOString(),
    source: "flashscore-html",
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
