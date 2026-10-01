// MatchZone scheduled data sync trigger.
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "data", "scraped-matches.json");
const OLD_LOGO_DIR = path.join(ROOT, "public", "teams");

const FOOTBALL_DATA_API = "https://api.football-data.org/v4";
const FOOTBALL_DATA_TOKEN = String(process.env.FOOTBALL_DATA_API_KEY || "").trim();
const ESPN_API = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const THESPORTSDB_API = "https://www.thesportsdb.com/api/v1/json/123";
const OPENFOOTBALL_API = "https://api.github.com/repos/openfootball/football.json/contents/2026-27";
const OPENFOOTBALL_WORLD_API = "https://api.github.com/repos/openfootball/world/contents";
const OPENFOOTBALL_WORLD_ROOTS = [
  ["europe", "أوروبا"],
  ["africa", "أفريقيا"],
  ["asia", "آسيا"],
  ["south-america", "أمريكا الجنوبية"],
  ["central-america", "أمريكا الوسطى"],
  ["north-america", "أمريكا الشمالية"],
  ["middle-east", "الشرق الأوسط"],
  ["pacific", "المحيط الهادئ"],
];
const AVATAR_BASE = "https://ui-avatars.com/api/";
const THESPORTSDB_ENRICH_LIMIT = 8;
const OPENFOOT_API = "https://openfootapi.com/v1";
const OPENFOOT_API_KEY = String(process.env.OPENFOOT_API_KEY || "").trim();
const OPENFOOT_COMPETITIONS = [
  ["comp_botola_pro_mar", "الدوري المغربي", "domestic"],
  ["comp_ligue_1_dza", "الدوري الجزائري", "domestic"],
  ["comp_egyptian_prem_egy", "الدوري المصري", "domestic"],
];

// Coverage Engine: ESPN is split into a fast current-day layer and a
// rotating future-calendar layer. GitHub Actions refreshes one future slice
// per run and keeps the other slices from the previous snapshot. This gives
// broad coverage without hammering ESPN with thousands of requests every run.
const ESPN_CURRENT_DAYS_BACK = 2;
const ESPN_CURRENT_DAYS_FORWARD = 1;
const ESPN_FUTURE_DAYS_FORWARD = 30;
const ESPN_ROTATION_GROUPS = 12;

/*
 * MatchZone data architecture
 *
 * 1) Football-Data.org is the authenticated primary source.
 * 2) ESPN's public site API is a free supplemental source for wider coverage.
 * 3) TheSportsDB is an optional detail-enrichment source only; it never creates
 *    primary matches and never supplies team identity or logos.
 * 4) Every primary provider keeps its own immutable identity namespace.
 * 5) Team names are display text only; they are NEVER used to identify a team.
 * 6) Logos come only from the exact primary provider team record.
 * 7) If a provider returns a logo collision or conflicting logo for one ID,
 *    the affected team is downgraded to a UI Avatar.
 * 8) The scraper writes one static snapshot. Visitors never call these APIs.
 *
 * ESPN is undocumented/public rather than an official developer API, so it is
 * deliberately cached by GitHub Actions and treated as a supplement, not the
 * sole source of truth.
 */

const ESPN_LEAGUES = [
  ["eng.1", "الدوري الإنجليزي", "domestic"],
  ["eng.2", "التشامبيونشيب", "domestic"],
  ["esp.1", "الدوري الإسباني", "domestic"],
  ["ger.1", "الدوري الألماني", "domestic"],
  ["ita.1", "الدوري الإيطالي", "domestic"],
  ["fra.1", "الدوري الفرنسي", "domestic"],
  ["ned.1", "الدوري الهولندي", "domestic"],
  ["por.1", "الدوري البرتغالي", "domestic"],
  ["bel.1", "الدوري البلجيكي", "domestic"],
  ["tur.1", "الدوري التركي", "domestic"],
  ["sco.1", "الدوري الاسكتلندي", "domestic"],
  ["usa.1", "الدوري الأمريكي MLS", "domestic"],
  ["mex.1", "الدوري المكسيكي", "domestic"],
  ["bra.1", "الدوري البرازيلي", "domestic"],
  ["arg.1", "الدوري الأرجنتيني", "domestic"],
  ["col.1", "الدوري الكولومبي", "domestic"],
  ["ksa.1", "الدوري السعودي", "domestic"],
  ["nor.1", "الدوري النرويجي", "domestic"],
  ["swe.1", "الدوري السويدي", "domestic"],
  ["den.1", "الدوري الدنماركي", "domestic"],
  ["aut.1", "الدوري النمساوي", "domestic"],
  ["gre.1", "الدوري اليوناني", "domestic"],
  ["cyp.1", "الدوري القبرصي", "domestic"],
  ["irl.1", "الدوري الأيرلندي", "domestic"],
  ["rus.1", "الدوري الروسي", "domestic"],
  ["eng.3", "الدوري الإنجليزي الدرجة الأولى", "domestic"],
  ["eng.4", "الدوري الإنجليزي الدرجة الثانية", "domestic"],
  ["eng.5", "الدوري الإنجليزي الوطني", "domestic"],
  ["esp.2", "الدوري الإسباني الدرجة الثانية", "domestic"],
  ["ger.2", "الدوري الألماني الدرجة الثانية", "domestic"],
  ["ita.2", "الدوري الإيطالي الدرجة الثانية", "domestic"],
  ["fra.2", "الدوري الفرنسي الدرجة الثانية", "domestic"],
  ["ned.2", "الدوري الهولندي الدرجة الثانية", "domestic"],
  ["sco.2", "الدوري الاسكتلندي الدرجة الثانية", "domestic"],
  ["sco.3", "الدوري الاسكتلندي الدرجة الثالثة", "domestic"],
  ["sco.4", "الدوري الاسكتلندي الدرجة الرابعة", "domestic"],
  ["fifa.world", "كأس العالم", "international-team"],
  ["fifa.worldq", "تصفيات كأس العالم", "international-team"],
  ["fifa.friendly", "مباريات دولية ودية", "international-team"],
  ["uefa.champions", "دوري أبطال أوروبا", "international-club"],
  ["uefa.europa", "الدوري الأوروبي", "international-club"],
  ["uefa.europa.conf", "دوري المؤتمر الأوروبي", "international-club"],
  ["conmebol.libertadores", "كوبا ليبرتادوريس", "international-club"],
  ["fifa.cwc", "كأس العالم للأندية", "international-club"],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function avatar(name) {
  const value = String(name || "Team").trim() || "Team";
  return (
    AVATAR_BASE +
    "?name=" +
    encodeURIComponent(value) +
    "&length=1&size=128&background=07100d&color=ffffff&bold=true&format=svg"
  );
}

function cleanHttpsUrl(value) {
  const url = String(value || "").trim();
  return /^https:\/\//i.test(url) ? url : null;
}

function isoDay(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function statusFromFootballData(value) {
  switch (String(value || "").toUpperCase()) {
    case "FINISHED":
    case "AWARDED":
      return "FT";
    case "LIVE":
    case "IN_PLAY":
    case "PAUSED":
      return "LIVE";
    case "POSTPONED":
    case "SUSPENDED":
    case "CANCELLED":
      return "POSTPONED";
    default:
      return "NS";
  }
}

function statusFromEspn(event) {
  const state = String(event?.status?.type?.state || "").toLowerCase();
  const name = String(event?.status?.type?.name || "").toUpperCase();
  const completed = Boolean(event?.status?.type?.completed);

  if (completed || state === "post") return "FT";
  if (state === "in" || /LIVE|HALFTIME|END_PERIOD/.test(name)) return "LIVE";
  if (/POSTPONED|CANCELLED|SUSPENDED/.test(name)) return "POSTPONED";
  return "NS";
}

function footballDataTeam(team, identityLogos) {
  const id = Number.isInteger(team?.id) ? team.id : null;
  const name = String(team?.name || team?.shortName || "Unknown Team").trim();
  const crest = cleanHttpsUrl(team?.crest);

  if (!id || !crest) {
    return {
      id,
      footballDataId: id,
      provider: "football-data.org",
      identity: id ? "football-data.org:" + id : null,
      name,
      logo: avatar(name),
      logoPath: avatar(name),
      logoSource: "UI Avatars",
      logoQuality: "avatar",
    };
  }

  const previous = identityLogos.get(id);
  if (previous && previous !== crest) {
    const safe = avatar(name);
    identityLogos.set(id, safe);
    return {
      id,
      footballDataId: id,
      provider: "football-data.org",
      identity: "football-data.org:" + id,
      name,
      logo: safe,
      logoPath: safe,
      logoSource: "UI Avatars",
      logoQuality: "identity-conflict",
    };
  }

  identityLogos.set(id, crest);
  return {
    id,
    footballDataId: id,
    provider: "football-data.org",
    identity: "football-data.org:" + id,
    name,
    logo: crest,
    logoPath: crest,
    logoSource: "Football-Data.org team ID",
    logoQuality: "verified-id",
  };
}

function espnTeam(team, identityLogos) {
  const rawId = team?.id;
  const id = String(rawId ?? "").trim();
  const name = String(team?.displayName || team?.name || team?.shortDisplayName || "Unknown Team").trim();
  const logo = cleanHttpsUrl(
    Array.isArray(team?.logos) ? team.logos[0]?.href : team?.logo
  );

  if (!id || !logo) {
    const safe = avatar(name);
    return {
      id: id || null,
      espnId: id || null,
      provider: "espn",
      identity: id ? "espn:" + id : null,
      name,
      logo: safe,
      logoPath: safe,
      logoSource: "UI Avatars",
      logoQuality: "avatar",
    };
  }

  const previous = identityLogos.get(id);
  if (previous && previous !== logo) {
    const safe = avatar(name);
    identityLogos.set(id, safe);
    return {
      id,
      espnId: id,
      provider: "espn",
      identity: "espn:" + id,
      name,
      logo: safe,
      logoPath: safe,
      logoSource: "UI Avatars",
      logoQuality: "identity-conflict",
    };
  }

  identityLogos.set(id, logo);
  return {
    id,
    espnId: id,
    provider: "espn",
    identity: "espn:" + id,
    name,
    logo,
    logoPath: logo,
    logoSource: "ESPN team ID",
    logoQuality: "verified-id",
  };
}

function makeFootballDataMatch(raw, identityLogos) {
  const home = footballDataTeam(raw.homeTeam, identityLogos);
  const away = footballDataTeam(raw.awayTeam, identityLogos);
  const id = Number(raw.id);

  return {
    fixture: {
      id: "fd-" + id,
      providerMatchId: id,
      date: raw.utcDate,
      status: { short: statusFromFootballData(raw.status) },
    },
    teams: { home, away },
    goals: {
      home: raw.score?.fullTime?.home ?? raw.score?.regularTime?.home ?? null,
      away: raw.score?.fullTime?.away ?? raw.score?.regularTime?.away ?? null,
    },
    league: {
      id: raw.competition?.id ?? null,
      name: raw.competition?.name || "Football",
      logo: cleanHttpsUrl(raw.competition?.emblem),
    },
    competitionType: "domestic",
    source: "football-data.org",
    externalId: id,
    externalIds: { "football-data.org": id },
    details: {
      events: [],
      statistics: [],
      updatedAt: null,
      source: "football-data.org",
    },
  };
}

function makeEspnMatch(event, leagueCode, leagueName, competitionType, identityLogos) {
  const competition = event?.competitions?.[0];
  const competitors = Array.isArray(competition?.competitors)
    ? competition.competitors
    : [];

  const homeRaw = competitors.find((item) => item?.homeAway === "home") || competitors[0];
  const awayRaw = competitors.find((item) => item?.homeAway === "away") || competitors[1];

  if (!homeRaw?.team?.id || !awayRaw?.team?.id || !event?.id) return null;

  const home = espnTeam(homeRaw.team, identityLogos);
  const away = espnTeam(awayRaw.team, identityLogos);
  const eventId = String(event.id);

  const homeScore = homeRaw?.score !== undefined && homeRaw?.score !== null
    ? Number(homeRaw.score)
    : null;
  const awayScore = awayRaw?.score !== undefined && awayRaw?.score !== null
    ? Number(awayRaw.score)
    : null;

  return {
    fixture: {
      id: "espn-" + leagueCode + "-" + eventId,
      providerMatchId: eventId,
      date: event.date,
      status: { short: statusFromEspn(event) },
    },
    teams: { home, away },
    goals: {
      home: Number.isFinite(homeScore) ? homeScore : null,
      away: Number.isFinite(awayScore) ? awayScore : null,
    },
    league: {
      id: "espn:" + leagueCode,
      name: leagueName || event?.season?.slug || "Football",
      logo: cleanHttpsUrl(
        event?.leagues?.[0]?.logos?.[0]?.href ||
        event?.league?.logos?.[0]?.href
      ),
    },
    competitionType,
    source: "espn",
    externalId: eventId,
    externalIds: { espn: eventId, "espn-league": leagueCode },
    details: {
      events: [],
      statistics: [],
      updatedAt: null,
      source: "espn",
    },
  };
}

function sanitizeMatches(matches) {
  const logoOwners = new Map();
  const prepared = matches.filter(Boolean);

  for (const match of prepared) {
    for (const side of ["home", "away"]) {
      const team = match?.teams?.[side];
      const identity = String(team?.identity || "").trim();
      const logo = String(team?.logo || "").trim();

      if (!identity || !logo || logo.includes("ui-avatars.com")) continue;

      const owner = logoOwners.get(logo);
      if (owner && owner !== identity) {
        for (const item of prepared) {
          for (const itemSide of ["home", "away"]) {
            const current = item?.teams?.[itemSide];
            if (String(current?.identity || "") === owner || String(current?.identity || "") === identity) {
              const safe = avatar(current.name);
              current.logo = safe;
              current.logoPath = safe;
              current.logoSource = "UI Avatars";
              current.logoQuality = "collision-sanitized";
            }
          }
        }
        logoOwners.delete(logo);
      } else {
        logoOwners.set(logo, identity);
      }
    }
  }

  for (const match of prepared) {
    const home = match.teams.home;
    const away = match.teams.away;

    if (
      home?.identity &&
      away?.identity &&
      home.identity !== away.identity &&
      home.logo &&
      away.logo &&
      home.logo === away.logo &&
      !home.logo.includes("ui-avatars.com")
    ) {
      home.logo = avatar(home.name);
      home.logoPath = home.logo;
      home.logoSource = "UI Avatars";
      home.logoQuality = "fixture-collision-sanitized";

      away.logo = avatar(away.name);
      away.logoPath = away.logo;
      away.logoSource = "UI Avatars";
      away.logoQuality = "fixture-collision-sanitized";
    }
  }

  return prepared;
}

async function fetchJson(url, options = {}) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        "User-Agent": "MatchZone/3.0",
        ...(options.headers || {}),
      },
    });

    if (response.status === 429 && attempt === 1) {
      await sleep(5000);
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error("HTTP " + response.status + ": " + body.slice(0, 240));
    }

    return response.json();
  }

  throw new Error("Request failed after retries");
}

let OPENFOOTBALL_WORLD_TREE_PROMISE = null;

async function listOpenFootballWorldFiles(pathPart = "", _depth = 0, limit = 250) {
  if (!OPENFOOTBALL_WORLD_TREE_PROMISE) {
    OPENFOOTBALL_WORLD_TREE_PROMISE = fetchJson(
      "https://api.github.com/repos/openfootball/world/git/trees/master?recursive=1",
      { headers: { Accept: "application/vnd.github+json" } }
    );
  }

  try {
    const tree = await OPENFOOTBALL_WORLD_TREE_PROMISE;
    const prefix = String(pathPart || "").replace(/\/$/, "") + "/";
    return (Array.isArray(tree?.tree) ? tree.tree : [])
      .filter((item) => item?.type === "blob" && item?.path?.startsWith(prefix) && /\.txt$/i.test(item.path))
      // Prioritize current-season/current-year files before historical seasons.
      // The Git tree is not guaranteed to be ordered, so applying the limit
      // before this sort can hide the leagues we actually need.
      .sort((a, b) => {
        const aPath = String(a?.path || "");
        const bPath = String(b?.path || "");
        const seasonRank = (value) => {
          if (/2026-27|2026(?:\.txt)?$/i.test(value)) return 3;
          if (/2025-26|2025(?:\.txt)?$/i.test(value)) return 2;
          if (/20\d{2}(?:-\d{2})?/i.test(value)) return 1;
          return 0;
        };
        const rankDiff = seasonRank(bPath) - seasonRank(aPath);
        return rankDiff || aPath.localeCompare(bPath);
      })
      .slice(0, limit)
      .map((item) => ({
        name: item.path.split("/").pop(),
        path: item.path,
        download_url: "https://raw.githubusercontent.com/openfootball/world/master/" + item.path,
      }));
  } catch (error) {
    console.warn("[OpenFootball World] tree unavailable:", error.message);
    return [];
  }
}
async function fetchOpenFootballWorldMatches(from, to) {
  const output = [];
  const catalog = [];
  const seen = new Set();
  for (const [root, region] of OPENFOOTBALL_WORLD_ROOTS) {
    const files = await listOpenFootballWorldFiles(root);
    for (const file of files) {
      if (seen.has(file.path)) continue;
      seen.add(file.path);
      const season = file.name.match(/20\d{2}(?:-\d{2})?/)?.[0] || null;
      const league = {
        id: "openfootball-world:" + file.path.replace(/\.txt$/i, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase(),
        name: file.name.replace(/\.txt$/i, ""), region, season, source: "openfootball-world", file: file.path,
      };
      catalog.push(league);
      if (season && !/2026(?:-27)?|2025-26/.test(file.name)) continue;
      try {
        const response = await fetch(file.download_url, { headers: { Accept: "text/plain", "User-Agent": "MatchZone/3.0" } });
        if (!response.ok) continue;
        const lines = (await response.text()).split(/\r?\n/);
        let currentDate = null;
        const title = lines.find((line) => /^=\s*/.test(line))?.replace(/^=\s*/, "").trim() || league.name;
        league.name = title;
        for (const raw of lines) {
          const dateMatch = raw.match(/^\s{2,}(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{4}))?\s*$/);
          if (dateMatch) {
            const year = dateMatch[3] || season?.slice(0, 4);
            if (year) currentDate = new Date(Date.parse(year + "-" + dateMatch[1] + "-" + dateMatch[2] + "T12:00:00Z"));
            continue;
          }
          if (!currentDate || Number.isNaN(currentDate.getTime())) continue;
          if (currentDate < new Date(isoDay(from) + "T00:00:00Z") || currentDate > new Date(isoDay(to) + "T23:59:59Z")) continue;
          const m = raw.match(/^\s{4,}(?:(\d{1,2}):(\d{2})\s+)?(.+?)\s+v\s+(.+?)\s+(\d+)\s*-\s*(\d+)(?:\s*\([^)]*\))?\s*$/);
          if (!m) continue;
          const [, hh, mm, homeName, awayName, hs, as] = m;
          const home = homeName.trim(), away = awayName.trim(), day = isoDay(currentDate);
          const externalId = file.path + ":" + day + ":" + home + ":" + away;
          const identity = (name) => "openfootball-world:" + file.path + ":" + normalizeTeamForSearch(name).replace(/\s+/g, "-");
          const time = hh && mm ? hh.padStart(2, "0") + ":" + mm : "12:00";
          output.push({
            fixture: { id: "openfootball-world-" + encodeURIComponent(externalId), providerMatchId: externalId, date: day + "T" + time + ":00Z", status: { short: "FT" } },
            teams: {
              home: { id: identity(home), provider: "openfootball-world", identity: identity(home), name: home, logo: avatar(home), logoPath: avatar(home), logoSource: "UI Avatars", logoQuality: "schedule-only" },
              away: { id: identity(away), provider: "openfootball-world", identity: identity(away), name: away, logo: avatar(away), logoPath: avatar(away), logoSource: "UI Avatars", logoQuality: "schedule-only" },
            },
            goals: { home: Number(hs), away: Number(as) },
            league: { id: league.id, name: league.name, logo: null, region, season },
            competitionType: "open-data", source: "openfootball-world", externalId, externalIds: { "openfootball-world": file.path },
            details: { events: [], statistics: [], updatedAt: null, source: "openfootball-world" },
          });
        }
      } catch (error) { console.warn("[OpenFootball World] file skipped", file.path, "-", error.message); }
    }
  }
  return { matches: output, catalog };
}
async function fetchOpenFootMatches(from, to) {
  if (!OPENFOOT_API_KEY) {
    console.warn("[OpenFoot] OPENFOOT_API_KEY missing; fallback skipped.");
    return [];
  }

  const output = [];

  // OpenFoot has its own season-wide response. Keep a slightly wider
  // source-specific window than the main snapshot so local kickoff dates
  // cannot be discarded just because another provider uses a tighter window.
  const openFootFrom = new Date(from);
  openFootFrom.setUTCDate(openFootFrom.getUTCDate() - 5);
  const openFootTo = new Date(from);
  openFootTo.setUTCDate(openFootTo.getUTCDate() + 30);
  const windowStart = new Date(isoDay(openFootFrom) + "T00:00:00Z");
  const windowEnd = new Date(isoDay(openFootTo) + "T23:59:59Z");
  const season = "2026/27";

  const status = (value) => {
    switch (String(value || "").toLowerCase()) {
      case "finished": return "FT";
      case "live": return "LIVE";
      case "postponed":
      case "cancelled": return "POSTPONED";
      default: return "NS";
    }
  };

  const team = (raw) => {
    const id = String(raw?.id || "").trim();
    const name = String(raw?.name || "Unknown Team").trim();
    const safe = avatar(name);
    return {
      id: id || null,
      openFootId: id || null,
      provider: "openfoot",
      identity: id ? "openfoot:" + id : null,
      name,
      logo: safe,
      logoPath: safe,
      logoSource: "UI Avatars",
      logoQuality: "schedule-only",
    };
  };

  for (const [competitionId, competitionName, competitionType] of OPENFOOT_COMPETITIONS) {
    const url = OPENFOOT_API + "/matches?competition=" +
      encodeURIComponent(competitionId) + "&season=" + encodeURIComponent(season);

    try {
      const data = await fetchJson(url, {
        headers: { Authorization: "Bearer " + OPENFOOT_API_KEY },
      });
      const records = Array.isArray(data?.data) ? data.data : [];
      let invalidDate = 0;
      let outsideWindow = 0;
      let missingTeamsOrId = 0;

      for (const item of records) {
        const kickoff = new Date(String(item?.kickoffAt || ""));
        if (Number.isNaN(kickoff.getTime())) {
          invalidDate += 1;
          continue;
        }
        if (kickoff < windowStart || kickoff > windowEnd) {
          outsideWindow += 1;
          continue;
        }

        const home = team(item?.homeTeam);
        const away = team(item?.awayTeam);
        if (!home.id || !away.id || !item?.id) {
          missingTeamsOrId += 1;
          continue;
        }

        const hs = Number(item?.homeScore);
        const as = Number(item?.awayScore);

        output.push({
          fixture: {
            id: "openfoot-" + String(item.id),
            providerMatchId: String(item.id),
            date: kickoff.toISOString(),
            status: { short: status(item?.status) },
          },
          teams: { home, away },
          goals: {
            home: Number.isFinite(hs) ? hs : null,
            away: Number.isFinite(as) ? as : null,
          },
          league: { id: competitionId, name: competitionName, logo: null },
          competitionType,
          source: "openfoot",
          externalId: String(item.id),
          externalIds: { openfoot: String(item.id), "openfoot-competition": competitionId },
          details: { events: [], statistics: [], updatedAt: null, source: "openfoot" },
        });
      }

      console.log("[OpenFoot]", competitionName, "records:", records.length,
        "accepted:", output.filter((m) => m.league?.id === competitionId).length,
        "invalidDate:", invalidDate,
        "outsideWindow:", outsideWindow,
        "missingTeamsOrId:", missingTeamsOrId);
    } catch (error) {
      console.warn("[OpenFoot] competition skipped", competitionId, "-", error.message);
    }
  }

  return output;
}

async function fetchOpenFootballMatches(from, to) {
  /*
   * OpenFootball is public-domain/CC0-style open data. It has no team IDs,
   * so this source is schedule/results-only: it never supplies logos or
   * primary team identity. Primary provider records always win on overlap.
   */
  const output = [];

  try {
    const directory = await fetchJson(OPENFOOTBALL_API, {
      headers: { Accept: "application/vnd.github+json" },
    });

    const files = Array.isArray(directory)
      ? directory.filter((item) => item?.type === "file" && /\.json$/i.test(item?.name))
      : [];

    for (const file of files) {
      try {
        const data = await fetchJson(file.download_url || file.html_url);
        const matches = Array.isArray(data?.matches) ? data.matches : [];

        for (const item of matches) {
          if (!item?.date || !item?.team1 || !item?.team2) continue;

          const date = String(item.date).trim();
          const day = new Date(date + "T12:00:00Z");
          if (Number.isNaN(day.getTime())) continue;

          const dayStart = new Date(isoDay(from) + "T00:00:00Z");
          const dayEnd = new Date(isoDay(to) + "T23:59:59Z");
          if (day < dayStart || day > dayEnd) continue;

          const team1 = String(item.team1).trim();
          const team2 = String(item.team2).trim();
          const ft = Array.isArray(item.score?.ft) ? item.score.ft : null;
          const hasScore = Array.isArray(ft) && ft.length >= 2 &&
            Number.isFinite(Number(ft[0])) && Number.isFinite(Number(ft[1]));

          const identity = (name) =>
            "openfootball:" +
            normalizeTeamForSearch(name).replace(/\s+/g, "-");

          output.push({
            fixture: {
              id:
                "openfootball-" +
                encodeURIComponent(file.name.replace(/\.json$/i, "")) +
                "-" +
                date +
                "-" +
                encodeURIComponent(normalizeTeamForSearch(team1)) +
                "-" +
                encodeURIComponent(normalizeTeamForSearch(team2)),
              providerMatchId:
                file.name + ":" + date + ":" + team1 + ":" + team2,
              date: item.time
                ? date + "T" + String(item.time).replace(/\s*UTC.*$/i, "") + ":00Z"
                : date + "T12:00:00Z",
              status: { short: hasScore ? "FT" : "NS" },
            },
            teams: {
              home: {
                id: identity(team1),
                provider: "openfootball",
                identity: identity(team1),
                name: team1,
                logo: avatar(team1),
                logoPath: avatar(team1),
                logoSource: "UI Avatars",
                logoQuality: "schedule-only",
              },
              away: {
                id: identity(team2),
                provider: "openfootball",
                identity: identity(team2),
                name: team2,
                logo: avatar(team2),
                logoPath: avatar(team2),
                logoSource: "UI Avatars",
                logoQuality: "schedule-only",
              },
            },
            goals: {
              home: hasScore ? Number(ft[0]) : null,
              away: hasScore ? Number(ft[1]) : null,
            },
            league: {
              id: "openfootball:" + file.name.replace(/\.json$/i, ""),
              name: String(data?.name || file.name).trim(),
              logo: null,
            },
            competitionType: "open-data",
            source: "openfootball",
            externalId: file.name + ":" + date + ":" + team1 + ":" + team2,
            externalIds: { openfootball: file.name },
            details: {
              events: [],
              statistics: [],
              updatedAt: null,
              source: "openfootball",
            },
          });
        }
      } catch (error) {
        console.warn("[OpenFootball] skipped", file?.name, "-", error.message);
      }
    }
  } catch (error) {
    console.warn("[OpenFootball] catalog unavailable:", error.message);
  }

  const world = await fetchOpenFootballWorldMatches(from, to);
  output.push(...world.matches);
  return { matches: output, catalog: world.catalog };
}

function fixtureSignature(match) {
  const day = isoDay(match?.fixture?.date || 0);
  return [
    day,
    normalizeTeamForSearch(match?.teams?.home?.name),
    normalizeTeamForSearch(match?.teams?.away?.name),
  ].join("|");
}

function removeOpenFootballOverlaps(primaryMatches, openMatches) {
  const occupied = new Set(primaryMatches.map(fixtureSignature));
  return openMatches.filter((match) => {
    const signature = fixtureSignature(match);
    if (occupied.has(signature)) return false;
    occupied.add(signature);
    return true;
  });
}

async function fetchFootballDataMatches(from, to) {
  if (!FOOTBALL_DATA_TOKEN) {
    console.warn("[Football-Data] secret missing; ESPN supplement will still run.");
    return [];
  }

  const url =
    FOOTBALL_DATA_API +
    "/matches?dateFrom=" +
    encodeURIComponent(isoDay(from)) +
    "&dateTo=" +
    encodeURIComponent(isoDay(to));

  try {
    const data = await fetchJson(url, {
      headers: { "X-Auth-Token": FOOTBALL_DATA_TOKEN },
    });
    return Array.isArray(data?.matches) ? data.matches : [];
  } catch (error) {
    console.warn("[Football-Data] unavailable:", error.message);
    return [];
  }
}

function dayList(from, to) {
  const days = [];
  for (
    let cursor = new Date(from);
    cursor <= to;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    days.push(isoDay(cursor).replaceAll("-", ""));
  }
  return days;
}

function espnRotationGroup(leagueIndex, rotationGroups = ESPN_ROTATION_GROUPS) {
  return leagueIndex % rotationGroups;
}

function currentRotationGroup() {
  // The workflow runs every 2 hours. Each group gets a fresh future window
  // roughly once per day, while today's matches are refreshed every run.
  const hour = new Date().getUTCHours();
  return Math.floor(hour / 2) % ESPN_ROTATION_GROUPS;
}

async function fetchEspnMatches(from, to) {
  const output = [];
  const refreshedLeagueCodes = new Set();

  const currentFrom = new Date(from);
  currentFrom.setUTCDate(currentFrom.getUTCDate() - ESPN_CURRENT_DAYS_BACK);
  const currentTo = new Date(from);
  currentTo.setUTCDate(currentTo.getUTCDate() + ESPN_CURRENT_DAYS_FORWARD);
  const currentDays = dayList(currentFrom, currentTo);

  const futureTo = new Date(from);
  futureTo.setUTCDate(futureTo.getUTCDate() + ESPN_FUTURE_DAYS_FORWARD);
  const rotationGroup = currentRotationGroup();

  for (let index = 0; index < ESPN_LEAGUES.length; index += 1) {
    const [leagueCode, leagueName, competitionType] = ESPN_LEAGUES[index];

    // Every league is checked for the immediate match window. Only the
    // current rotation slice receives the full future-calendar refresh.
    const days = [...currentDays];
    if (espnRotationGroup(index) === rotationGroup) {
      const futureFrom = new Date(from);
      futureFrom.setUTCDate(futureFrom.getUTCDate() + 2);
      days.push(...dayList(futureFrom, futureTo));
      refreshedLeagueCodes.add(leagueCode);
    }

    const uniqueDays = [...new Set(days)];

    for (const day of uniqueDays) {
      const url =
        ESPN_API +
        "/" +
        encodeURIComponent(leagueCode) +
        "/scoreboard?dates=" +
        day +
        "&limit=500";

      try {
        const data = await fetchJson(url);
        if (Array.isArray(data?.events)) {
          for (const event of data.events) {
            output.push({ event, leagueCode, leagueName, competitionType });
          }
        }
      } catch (error) {
        console.warn("[ESPN] day skipped", leagueCode, day, "-", error.message);
      }
    }
  }

  return { matches: output, refreshedLeagueCodes };
}

async function loadPreviousEspnMatches() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data?.matches)
      ? data.matches.filter((match) => match?.source === "espn")
      : [];
  } catch {
    return [];
  }
}

function normalizeTeamForSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(fc|cf|afc|sc|ac|club|football club)\b/gi, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sameTeamName(a, b) {
  const left = normalizeTeamForSearch(a);
  const right = normalizeTeamForSearch(b);
  return left && right && (left === right || left.includes(right) || right.includes(left));
}

function parseTheSportsDbEventDate(event) {
  const value = String(event?.strTimestamp || event?.dateEvent || "").trim();
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function eventMatchesPrimary(match, event) {
  const home = match?.teams?.home?.name;
  const away = match?.teams?.away?.name;
  if (!sameTeamName(home, event?.strHomeTeam) || !sameTeamName(away, event?.strAwayTeam)) {
    return false;
  }

  const primaryDate = new Date(match?.fixture?.date || 0);
  const eventDate = parseTheSportsDbEventDate(event);
  if (!Number.isFinite(primaryDate.getTime()) || !eventDate) return false;

  // Time zones can differ between providers; require the same calendar day
  // in UTC rather than guessing a timezone conversion.
  return isoDay(primaryDate) === isoDay(eventDate);
}

async function enrichWithTheSportsDb(matches) {
  const candidates = matches
    .filter((match) => match?.fixture?.status?.short === "FT")
    .filter((match) => !match?.details?.events?.length && !match?.details?.statistics?.length)
    .slice(0, THESPORTSDB_ENRICH_LIMIT);

  let enriched = 0;

  for (const match of candidates) {
    const query = [
      String(match?.teams?.home?.name || "").trim(),
      "vs",
      String(match?.teams?.away?.name || "").trim(),
    ].join("_");

    try {
      const searchUrl =
        THESPORTSDB_API +
        "/searchevents.php?e=" +
        encodeURIComponent(query);

      const search = await fetchJson(searchUrl);
      const event = Array.isArray(search?.event)
        ? search.event.find((item) => eventMatchesPrimary(match, item))
        : null;

      if (!event?.idEvent) continue;

      const eventId = String(event.idEvent);
      const [timelineResult, statsResult] = await Promise.allSettled([
        fetchJson(THESPORTSDB_API + "/lookuptimeline.php?id=" + encodeURIComponent(eventId)),
        fetchJson(THESPORTSDB_API + "/lookupeventstats.php?id=" + encodeURIComponent(eventId)),
      ]);

      const timeline =
        timelineResult.status === "fulfilled" && Array.isArray(timelineResult.value?.timeline)
          ? timelineResult.value.timeline
          : [];

      const statistics =
        statsResult.status === "fulfilled" && Array.isArray(statsResult.value?.eventstats)
          ? statsResult.value.eventstats
          : [];

      if (timeline.length || statistics.length) {
        match.details = {
          ...(match.details || {}),
          events: timeline,
          statistics,
          theSportsDbEventId: eventId,
          updatedAt: new Date().toISOString(),
          source: "primary provider + TheSportsDB enrichment",
        };
        match.externalIds = {
          ...(match.externalIds || {}),
          thesportsdb: eventId,
        };
        enriched += 1;
      }
    } catch (error) {
      console.warn("[TheSportsDB] skipped", match?.fixture?.id, "-", error.message);
    }

    // Free tier is 30 requests/minute. Keep this enrichment deliberately low.
    await sleep(2200);
  }

  return enriched;
}

function dedupeMatches(matches) {
  const seenProviderIds = new Set();
  const unique = [];

  for (const match of matches) {
    const provider = String(match?.source || "").trim();
    const external = String(match?.externalId || "").trim();
    const providerKey = provider + ":" + external;

    if (!provider || !external || seenProviderIds.has(providerKey)) continue;
    seenProviderIds.add(providerKey);
    unique.push(match);
  }

  /*
   * A single fixture can legitimately exist in more than one provider.
   * This is fixture-level deduplication only; it NEVER merges team identities.
   * Keep the strongest source record so the UI does not show the same game twice.
   */
  const priority = {
    "football-data.org": 4,
    espn: 3,
    openfoot: 2,
    openfootball: 1,
  };
  const byFixture = new Map();

  for (const match of unique) {
    const signature = fixtureSignature(match);
    const current = byFixture.get(signature);
    if (!current || (priority[match.source] || 0) > (priority[current.source] || 0)) {
      byFixture.set(signature, match);
    }
  }

  return [...byFixture.values()].sort(
    (a, b) =>
      new Date(a?.fixture?.date || 0).getTime() -
      new Date(b?.fixture?.date || 0).getTime()
  );
}


async function loadPreviousStandings() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    return data?.standings && typeof data.standings === "object" ? data.standings : {};
  } catch {
    return {};
  }
}

function readEspnStandingStat(entry, name) {
  const stat = Array.isArray(entry?.stats)
    ? entry.stats.find((item) => String(item?.name || "").toLowerCase() === name)
    : null;
  if (!stat) return null;
  const value = Number(stat.value);
  return Number.isFinite(value) ? value : stat.displayValue ?? null;
}

async function fetchEspnStandings(previousStandings = {}) {
  const result = { ...previousStandings };
  const group = currentRotationGroup();
  let refreshed = 0;

  for (let index = 0; index < ESPN_LEAGUES.length; index += 1) {
    if (espnRotationGroup(index) !== group) continue;

    const [leagueCode, leagueName, competitionType] = ESPN_LEAGUES[index];
    const url =
      "https://site.api.espn.com/apis/v2/sports/soccer/" +
      encodeURIComponent(leagueCode) +
      "/standings";

    try {
      const data = await fetchJson(url);
      const groups = Array.isArray(data?.children) ? data.children : [];
      const tables = groups
        .map((child) => ({
          name: child?.name || "الترتيب",
          entries: Array.isArray(child?.standings?.entries)
            ? child.standings.entries
            : [],
        }))
        .filter((group) => group.entries.length);

      if (!tables.length) continue;

      result[leagueCode] = {
        source: "espn",
        leagueCode,
        leagueName,
        competitionType,
        season: data?.season || null,
        updatedAt: new Date().toISOString(),
        groups: tables.map((table) => ({
          name: table.name,
          entries: table.entries.map((entry, position) => ({
            rank: position + 1,
            team: {
              id: String(entry?.team?.id || "").trim(),
              name: String(entry?.team?.displayName || entry?.team?.name || "فريق").trim(),
              logo: cleanHttpsUrl(entry?.team?.logos?.[0]?.href) || null,
            },
            played: readEspnStandingStat(entry, "gamesplayed"),
            wins: readEspnStandingStat(entry, "wins"),
            draws: readEspnStandingStat(entry, "ties"),
            losses: readEspnStandingStat(entry, "losses"),
            points: readEspnStandingStat(entry, "points"),
            goalsFor: readEspnStandingStat(entry, "goalsfor"),
            goalsAgainst: readEspnStandingStat(entry, "goalsagainst"),
            goalDifference: readEspnStandingStat(entry, "goaldifference"),
            form: readEspnStandingStat(entry, "form"),
          })),
        })),
      };
      refreshed += 1;
    } catch (error) {
      console.warn("[ESPN standings] skipped", leagueCode, "-", error.message);
    }
  }

  return { standings: result, refreshed, rotationGroup: group };
}

async function main() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.rm(OLD_LOGO_DIR, { recursive: true, force: true });

  const now = new Date();
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - 2);

  const to = new Date(now);
  // Keep a useful rolling fixture calendar: past 2 days + next 30 days.\n  // The snapshot is refreshed by GitHub Actions, so visitors never hit providers directly.\n  to.setUTCDate(to.getUTCDate() + 30);

  const identityLogos = new Map();

  const footballDataRaw = await fetchFootballDataMatches(from, to);
  const openFootballResult = await fetchOpenFootballMatches(from, to);
  const openFootballRaw = openFootballResult.matches;
  const openFootRaw = await fetchOpenFootMatches(from, to);
  const footballDataMatches = footballDataRaw.map((item) =>
    makeFootballDataMatch(item, identityLogos)
  );

  const previousEspnMatches = await loadPreviousEspnMatches();
  const previousStandings = await loadPreviousStandings();
  const espnResult = await fetchEspnMatches(from, to);
  const standingsResult = await fetchEspnStandings(previousStandings);
  const espnMatches = espnResult.matches.map((item) =>
    makeEspnMatch(
      item.event,
      item.leagueCode,
      item.leagueName,
      item.competitionType,
      identityLogos
    )
  );

  // Keep every previous ESPN fixture that is still inside the rolling window.
  // Fresh ESPN records are placed before retained records below, so a fresh
  // record with the same provider fixture ID always wins. This prevents a
  // rotation run from accidentally shrinking coverage just because ESPN
  // returned a temporarily incomplete future calendar for one league.
  const retainedPreviousEspn = previousEspnMatches.filter((match) => {
    const date = new Date(match?.fixture?.date || 0);
    return (
      Number.isFinite(date.getTime()) &&
      date >= new Date(isoDay(from) + "T00:00:00Z") &&
      date <= new Date(isoDay(to) + "T23:59:59Z")
    );
  });

  /*
   * Football-Data.org already supplies Brazilian Série A in the current free
   * account. Skip ESPN bra.1 to avoid two provider records for the same league.
   * This is a source configuration rule, not team-name matching.
   */
  const openFootballMatches = removeOpenFootballOverlaps(
    [...footballDataMatches, ...espnMatches, ...openFootRaw],
    openFootballRaw
  );

  const openFootMatches = removeOpenFootballOverlaps(
    [...footballDataMatches, ...espnMatches],
    openFootRaw
  );

  const supplemental = [...retainedPreviousEspn, ...espnMatches].filter(
    (match) => String(match?.externalIds?.["espn-league"] || "") !== "bra.1"
  );

  const matches = sanitizeMatches(
    dedupeMatches([...footballDataMatches, ...supplemental, ...openFootMatches, ...openFootballMatches])
  );

  // Unified league catalog: league identity is provider-scoped; names are display-only.
  const leagueMap = new Map();
  const addLeague = (league, source, matchCount = 0) => {
    const id = String(league?.id || "").trim();
    if (!id) return;
    const existing = leagueMap.get(id) || {
      id,
      name: String(league?.name || id).trim(),
      region: league?.region || null,
      season: league?.season || null,
      source: source || league?.source || "unknown",
      file: league?.file || null,
      logo: cleanHttpsUrl(league?.logo) || null,
      matchCount: 0,
    };
    existing.matchCount += matchCount;
    if (!existing.logo && cleanHttpsUrl(league?.logo)) {
      existing.logo = cleanHttpsUrl(league.logo);
    }
    leagueMap.set(id, existing);
  };

  for (const match of matches) addLeague(match.league, match.source, 1);
  for (const league of openFootballResult.catalog) addLeague(league, league.source, 0);

  const leagues = [...leagueMap.values()]
    .map((league) => ({ ...league, currentCoverage: league.matchCount > 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const theSportsDbEnriched = await enrichWithTheSportsDb(matches);

  if (!matches.length) {
    throw new Error("No matches returned by either source; refusing to replace the live datastore.");
  }

  const payload = {
    schemaVersion: 3,
    updatedAt: new Date().toISOString(),
    source: "football-data.org + ESPN + OpenFootball + TheSportsDB enrichment",
    coverageWindow: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    sourcePolicy: {
      primary: "football-data.org",
      supplemental: "ESPN public site API + OpenFootball public-domain datasets + OpenFoot fallback",
      coverageEngine: "ESPN current-window refresh + rotating future-calendar slices preserved across snapshots",
      detailEnrichment: "TheSportsDB V1 free API (existing matches only; no team identity/logo authority)",
      cacheStrategy: "GitHub Actions snapshot; visitors never call providers",
      note: "ESPN endpoint is public/undocumented; OpenFootball is schedule/results-only; OpenFoot is a quota-limited fallback for selected leagues. Neither source overrides verified provider identity or logos.",
    },
    logoPolicy: {
      identityKey: "provider namespace + immutable numeric/string provider team ID",
      nameLookup: false,
      localLogoCache: false,
      secondaryLogoProvider: false,
      detailProvider: "TheSportsDB may enrich events/statistics only",
      collisionPolicy: "different provider identities sharing a logo are replaced by UI Avatars",
      unknownTeamPolicy: "UI Avatars",
    },
    standings: standingsResult.standings,
    counts: {
      footballData: footballDataMatches.length,
      espn: supplemental.length,
      espnFreshRun: espnMatches.length,
      espnRetained: retainedPreviousEspn.length,
      espnFutureRotationGroup: currentRotationGroup(),
      openfootball: openFootballMatches.length,
      openfootballWorld: openFootballResult.matches.length,
      openfoot: openFootMatches.length,
      total: matches.length,
      theSportsDbEnriched,
      standingsRefreshed: standingsResult.refreshed,
      standingsRotationGroup: standingsResult.rotationGroup,
      standingsLeagues: Object.keys(standingsResult.standings).length,
    },
    matchCount: matches.length,
    leagues,
    leagueCount: leagues.length,
    currentLeagueCount: leagues.filter((league) => league.currentCoverage).length,
    catalogLeagueCount: leagues.length,
    matches,
  };

  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log("[MATCHZONE] Football-Data matches:", footballDataMatches.length);
  console.log("[MATCHZONE] ESPN supplemental matches:", supplemental.length);
  console.log("[MATCHZONE] Total:", matches.length);
  console.log("[MATCHZONE] OpenFootball world matches:", openFootballResult.matches.length);
  console.log("[MATCHZONE] OpenFoot fallback matches:", openFootMatches.length);
  console.log("[MATCHZONE] Unified league catalog:", leagues.length, "(current:", payload.currentLeagueCount + ")");
  console.log("[MATCHZONE] Leagues:", payload.leagueCount);
  console.log("[MATCHZONE] Standings refreshed:", standingsResult.refreshed, "rotation group:", standingsResult.rotationGroup, "cached leagues:", Object.keys(standingsResult.standings).length);
  console.log("[MATCHZONE] Snapshot written:", DATA_FILE);
}

main().catch((error) => {
  console.error("[MATCHZONE] SCRAPER FAILED:", error);
  process.exit(1);
});
