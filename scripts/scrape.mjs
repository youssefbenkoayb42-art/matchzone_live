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
const AVATAR_BASE = "https://ui-avatars.com/api/";
const THESPORTSDB_ENRICH_LIMIT = 8;

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
  ["nor.1", "الدوري النرويجي", "domestic"],
  ["swe.1", "الدوري السويدي", "domestic"],
  ["den.1", "الدوري الدنماركي", "domestic"],
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

  return output;
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

async function fetchEspnMatches(from, to) {
  const start = isoDay(from).replaceAll("-", "");
  const end = isoDay(to).replaceAll("-", "");
  const output = [];

  /*
   * ESPN accepts a date range. One request per competition is dramatically
   * cheaper than one request per competition/day, while keeping the same
   * 10-day coverage window.
   */
  for (const [leagueCode, leagueName, competitionType] of ESPN_LEAGUES) {
    const url =
      ESPN_API +
      "/" +
      encodeURIComponent(leagueCode) +
      "/scoreboard?dates=" +
      start +
      "-" +
      end +
      "&limit=500";

    try {
      const data = await fetchJson(url);
      if (Array.isArray(data?.events)) {
        for (const event of data.events) {
          output.push({ event, leagueCode, leagueName, competitionType });
        }
      }
    } catch (error) {
      console.warn("[ESPN] range request failed", leagueCode, "-", error.message);
      // Safe fallback: request the same window in two halves.
      const midpoint = new Date(from);
      midpoint.setUTCDate(midpoint.getUTCDate() + 4);
      const ranges = [
        [from, midpoint],
        [new Date(midpoint.getTime() + 86400000), to],
      ];

      for (const [rangeFrom, rangeTo] of ranges) {
        const rangeStart = isoDay(rangeFrom).replaceAll("-", "");
        const rangeEnd = isoDay(rangeTo).replaceAll("-", "");
        const fallbackUrl =
          ESPN_API +
          "/" +
          encodeURIComponent(leagueCode) +
          "/scoreboard?dates=" +
          rangeStart +
          "-" +
          rangeEnd +
          "&limit=500";

        try {
          const fallback = await fetchJson(fallbackUrl);
          if (Array.isArray(fallback?.events)) {
            for (const event of fallback.events) {
              output.push({ event, leagueCode, leagueName, competitionType });
            }
          }
        } catch (fallbackError) {
          console.warn(
            "[ESPN] fallback skipped",
            leagueCode,
            rangeStart + "-" + rangeEnd,
            "-",
            fallbackError.message
          );
        }
      }
    }
  }

  return output;
}

function normalizeTeamForSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/\\b(fc|cf|afc|sc|ac|club|football club)\\b/gi, "")
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
  const seen = new Set();

  return matches
    .filter((match) => {
      const provider = String(match?.source || "");
      const external = String(match?.externalId || "");
      const key = provider + ":" + external;
      if (!provider || !external || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a?.fixture?.date || 0).getTime() -
        new Date(b?.fixture?.date || 0).getTime()
    );
}

async function main() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.rm(OLD_LOGO_DIR, { recursive: true, force: true });

  const now = new Date();
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - 2);

  const to = new Date(now);
  to.setUTCDate(to.getUTCDate() + 7);

  const identityLogos = new Map();

  const footballDataRaw = await fetchFootballDataMatches(from, to);
  const openFootballRaw = await fetchOpenFootballMatches(from, to);
  const footballDataMatches = footballDataRaw.map((item) =>
    makeFootballDataMatch(item, identityLogos)
  );

  const espnRaw = await fetchEspnMatches(from, to);
  const espnMatches = espnRaw.map((item) =>
    makeEspnMatch(
      item.event,
      item.leagueCode,
      item.leagueName,
      item.competitionType,
      identityLogos
    )
  );

  /*
   * Football-Data.org already supplies Brazilian Série A in the current free
   * account. Skip ESPN bra.1 to avoid two provider records for the same league.
   * This is a source configuration rule, not team-name matching.
   */
  const openFootballMatches = removeOpenFootballOverlaps(
    footballDataMatches,
    openFootballRaw
  );

  const supplemental = espnMatches.filter(
    (match) => String(match?.externalIds?.["espn-league"] || "") !== "bra.1"
  );

  const matches = sanitizeMatches(
    dedupeMatches([...footballDataMatches, ...supplemental, ...openFootballMatches])
  );

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
      supplemental: "ESPN public site API + OpenFootball public-domain datasets",
      detailEnrichment: "TheSportsDB V1 free API (existing matches only; no team identity/logo authority)",
      cacheStrategy: "GitHub Actions snapshot; visitors never call providers",
      note: "ESPN endpoint is public/undocumented; OpenFootball is used only for schedule/results coverage and never overrides verified provider identity or logos.",
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
    counts: {
      footballData: footballDataMatches.length,
      espn: supplemental.length,
      openfootball: openFootballMatches.length,
      total: matches.length,
      theSportsDbEnriched,
    },
    matchCount: matches.length,
    leagueCount: new Set(
      matches.map((m) => String(m.league?.id || "")).filter(Boolean)
    ).size,
    matches,
  };

  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log("[MATCHZONE] Football-Data matches:", footballDataMatches.length);
  console.log("[MATCHZONE] ESPN supplemental matches:", supplemental.length);
  console.log("[MATCHZONE] Total:", matches.length);
  console.log("[MATCHZONE] Leagues:", payload.leagueCount);
  console.log("[MATCHZONE] Snapshot written:", DATA_FILE);
}

main().catch((error) => {
  console.error("[MATCHZONE] SCRAPER FAILED:", error);
  process.exit(1);
});
