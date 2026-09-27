import fs from "node:fs/promises";
import path from "node:path";

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

function flashscoreLogo(filename) {
  const value = String(filename || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return "https://static.flashscore.com/res/image/data/" + value;
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
      home: {
        id: record.AU || null,
        name: record.AE,
        logo: flashscoreLogo(record.OB),
      },
      away: {
        id: record.AV || null,
        name: record.AF,
        logo: flashscoreLogo(record.AW),
      },
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


function parseDetailRecords(raw) {
  return String(raw || "").split("~").map((block) => {
    const record = {};
    for (const cell of block.split("¬")) {
      const index = cell.indexOf("÷");
      if (index <= 0) continue;
      record[cell.slice(0, index)] = cell.slice(index + 1);
    }
    return record;
  }).filter((record) => Object.keys(record).length > 0);
}

function resolveDetailTeam(value, match) {
  const raw = String(value || "").trim().toLowerCase();
  const homeId = String(match.teams?.home?.id || "").toLowerCase();
  const awayId = String(match.teams?.away?.id || "").toLowerCase();
  if (raw === "1" || raw === "home" || raw === homeId) return "home";
  if (raw === "2" || raw === "away" || raw === awayId) return "away";
  return null;
}

function eventTypeFromCode(code, record) {
  const value = String(code || "").trim().toLowerCase();
  const combined = [record?.IA, record?.IT, record?.ID, record?.IC, record?.type].join(" ").toLowerCase();
  if (value === "1" || /goal|score|penalty/.test(combined)) return "goal";
  if (value === "2" || /yellow/.test(combined)) return "yellow";
  if (value === "3" || /red/.test(combined)) return "red";
  if (value === "4" || /substitution|substitute/.test(combined)) return "substitution";
  if (/var/.test(combined)) return "var";
  return "other";
}

function parseMatchEvents(raw, match) {
  const events = [];
  for (const [index, record] of parseDetailRecords(raw).entries()) {
    if (!record.IB && !record.IA && !record.IF) continue;
    events.push({
      id: `${match.externalId || match.fixture?.id}-${index}`,
      minute: record.IB || record.IH || "",
      type: eventTypeFromCode(record.IA, record),
      team: resolveDetailTeam(record.IK || record.IJ || record.team, match),
      player: record.IF || record.IN || record.IM || record.player || null,
      assist: record.IG || record.IP || record.assist || null,
      playerIn: record.II || record.playerIn || null,
      playerOut: record.IJ || record.playerOut || null,
      scoreHome: record.AG ?? null,
      scoreAway: record.AH ?? null,
      rawType: record.IA || null
    });
  }
  return events;
}

function cleanStatValue(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeStatName(name) {
  return String(name || "").trim().toLowerCase().replace(/[%()[\\].,:-]+/g, " ").replace(/\\s+/g, " ");
}

function parseMatchStatistics(raw) {
  const statistics = [];
  for (const record of parseDetailRecords(raw)) {
    const name = record.SG || record.SD || record.name;
    if (!name || (record.SH === undefined && record.SI === undefined)) continue;
    const normalized = normalizeStatName(name);
    let key = normalized.replace(/\\s+/g, "_");
    if (normalized.includes("ball possession") || normalized.includes("possession") || normalized.includes("влад")) key = "possession";
    else if (normalized.includes("shots on target") || normalized.includes("shots on goal")) key = "shots_on_target";
    else if (normalized.includes("total shots") || normalized.includes("shots") || normalized.includes("удар")) key = "shots";
    else if (normalized.includes("corner kicks") || normalized.includes("corners") || normalized.includes("corner")) key = "corners";
    statistics.push({
      name: String(name).trim(),
      key,
      home: cleanStatValue(record.SH),
      away: cleanStatValue(record.SI),
      period: record.SF || record.SE || "match"
    });
  }
  const seen = new Set();
  return statistics.filter((stat) => {
    const identity = `${stat.period}|${stat.key}|${stat.name}|${stat.home}|${stat.away}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

async function fetchDetailFeed(path) {
  let lastError = null;
  for (const host of FEED_HOSTS) {
    const endpoint = `${host}/${path}`;
    try {
      const response = await fetch(endpoint, {
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
          "Cache-Control": "no-cache"
        }
      });
      if (!response.ok) throw new Error(`detail HTTP ${response.status}`);
      const text = await response.text();
      if (!text || text.length < 10) throw new Error("empty detail feed");
      return text;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("all detail hosts failed");
}

async function scrapeMatchDetails(matches) {
  const targets = matches.filter((match) => ["FT", "LIVE"].includes(String(match.fixture?.status?.short || "").toUpperCase()));
  const details = new Map();
  console.log("[scraper] collecting match details for", targets.length, "finished/live matches");

  for (const match of targets) {
    const id = String(match.externalId || "").trim();
    if (!id) continue;
    let events = [];
    let statistics = [];
    let eventOk = false;
    let statsOk = false;

    try {
      const raw = await fetchDetailFeed(`df_sui_1_${id}`);
      events = parseMatchEvents(raw, match);
      eventOk = true;
    } catch (error) {
      console.warn("[scraper] events failed", id, error.message);
    }

    try {
      const raw = await fetchDetailFeed(`df_st_1_${id}`);
      statistics = parseMatchStatistics(raw);
      statsOk = true;
    } catch (error) {
      console.warn("[scraper] stats failed", id, error.message);
    }

    if (eventOk || statsOk) {
      details.set(id, {
        events,
        statistics,
        updatedAt: new Date().toISOString(),
        source: "Flashscore detail feed",
        sourceEndpoints: {
          events: eventOk ? `df_sui_1_${id}` : null,
          statistics: statsOk ? `df_st_1_${id}` : null
        }
      });
    }
    await sleep(450);
  }
  console.log("[scraper] saved details for", details.size, "matches");
  return details;
}

function mergeFeedMatches(existing, incoming) {
  return {
    ...existing,
    ...incoming,
    fixture: {
      ...(existing.fixture || {}),
      ...(incoming.fixture || {}),
      status: {
        ...(existing.fixture?.status || {}),
        ...(incoming.fixture?.status || {}),
      },
    },
    teams: {
      home: {
        ...(existing.teams?.home || {}),
        ...(incoming.teams?.home || {}),
        logo: incoming.teams?.home?.logo || existing.teams?.home?.logo || null,
      },
      away: {
        ...(existing.teams?.away || {}),
        ...(incoming.teams?.away || {}),
        logo: incoming.teams?.away?.logo || existing.teams?.away?.logo || null,
      },
    },
    goals: {
      ...(existing.goals || {}),
      ...(incoming.goals || {}),
    },
    league: {
      ...(existing.league || {}),
      ...(incoming.league || {}),
    },
    details: incoming.details || existing.details || {
      events: [],
      statistics: [],
      updatedAt: null,
    },
  };
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

    if (byId.has(id)) {
      const merged = mergeFeedMatches(byId.get(id), match);
      byId.set(id, merged);
      byFixture.set(fixtureKey, merged);
      continue;
    }

    if (byFixture.has(fixtureKey)) {
      const existing = byFixture.get(fixtureKey);
      const merged = mergeFeedMatches(existing, match);
      const oldId = String(existing.fixture?.id || "");
      const chosenId =
        existing.fixture?.status?.short !== "FT" && match.fixture?.status?.short === "FT"
          ? id
          : oldId;

      byId.delete(oldId);
      byId.set(chosenId, merged);
      byFixture.set(fixtureKey, merged);
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

  const baseMerged = dedupe([...(previous.matches || []), ...scraped]).slice(-5000);
  const detailMap = await scrapeMatchDetails(scraped);

  const merged = baseMerged.map((match) => {
    const id = String(match.externalId || "").trim();
    const freshDetails = detailMap.get(id);
    if (!freshDetails) {
      return {
        ...match,
        details: match.details || {
          events: [],
          statistics: [],
          updatedAt: null,
        },
      };
    }
    return {
      ...match,
      details: freshDetails,
    };
  });

  const payload = {
    updatedAt: new Date().toISOString(),
    source: scraped.some((m) => m.source === "Flashscore Feed") ? "flashscore-feed" : "flashscore-html",
    leagueCount: LEAGUES.length,
    matchCount: merged.length,
    detailMatchCount: merged.filter((m) => (m.details?.events?.length || 0) + (m.details?.statistics?.length || 0) > 0).length,
    matches: merged,
  };

  await fs.writeFile(OUTPUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log("[scraper] saved", merged.length, "unique matches from", LEAGUES.length, "competitions");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
