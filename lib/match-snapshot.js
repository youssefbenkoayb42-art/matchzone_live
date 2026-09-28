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

function teamIdentity(team) {
  return String(team?.identity || team?.id || "").trim();
}

function matchStatus(match) {
  return String(match?.fixture?.status?.short || "NS").toUpperCase();
}

function isFinishedMatch(match) {
  return ["FT", "AET", "PEN", "FINISHED"].includes(matchStatus(match));
}

function isLiveMatch(match) {
  return ["LIVE", "1H", "2H", "HT", "ET", "P"].includes(matchStatus(match));
}

function teamStatsForMatches(teamId, matches) {
  let played = 0, wins = 0, draws = 0, losses = 0;
  let goalsFor = 0, goalsAgainst = 0, cleanSheets = 0;

  for (const match of Array.isArray(matches) ? matches : []) {
    if (!isFinishedMatch(match)) continue;
    const homeId = teamIdentity(match?.teams?.home);
    const awayId = teamIdentity(match?.teams?.away);
    const isHome = homeId === teamId;
    const isAway = awayId === teamId;
    if (!isHome && !isAway) continue;

    const gf = Number(isHome ? match?.goals?.home : match?.goals?.away);
    const ga = Number(isHome ? match?.goals?.away : match?.goals?.home);
    if (!Number.isFinite(gf) || !Number.isFinite(ga)) continue;

    played += 1;
    goalsFor += gf;
    goalsAgainst += ga;
    if (ga === 0) cleanSheets += 1;
    if (gf > ga) wins += 1;
    else if (gf === ga) draws += 1;
    else losses += 1;
  }

  return {
    played, wins, draws, losses,
    points: wins * 3 + draws,
    goalsFor, goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    cleanSheets,
  };
}

export function buildTeamCatalog(matches) {
  const map = new Map();

  for (const match of Array.isArray(matches) ? matches : []) {
    for (const side of ["home", "away"]) {
      const team = match?.teams?.[side];
      const id = teamIdentity(team);
      if (!id) continue;

      const current = map.get(id) || {
        id,
        provider: team?.provider || null,
        providerId: team?.id || null,
        name: team?.name || "فريق",
        logo: team?.logo || null,
        logoQuality: team?.logoQuality || "unknown",
        logoSource: team?.logoSource || null,
        leagueIds: new Set(),
        matchCount: 0,
        finishedCount: 0,
        upcomingCount: 0,
        liveCount: 0,
        lastMatchAt: null,
        nextMatchAt: null,
      };

      if (!current.logo || current.logo.includes("ui-avatars.com")) {
        if (team?.logo) current.logo = team.logo;
        if (team?.logoQuality) current.logoQuality = team.logoQuality;
        if (team?.logoSource) current.logoSource = team.logoSource;
      }

      if (match?.league?.id) current.leagueIds.add(String(match.league.id));
      current.matchCount += 1;

      const date = new Date(match?.fixture?.date || 0);
      const time = date.getTime();

      if (isFinishedMatch(match)) {
        current.finishedCount += 1;
        if (Number.isFinite(time) && (!current.lastMatchAt || time > new Date(current.lastMatchAt).getTime())) {
          current.lastMatchAt = date.toISOString();
        }
      } else if (isLiveMatch(match)) {
        current.liveCount += 1;
      } else {
        current.upcomingCount += 1;
        if (Number.isFinite(time) && (!current.nextMatchAt || time < new Date(current.nextMatchAt).getTime())) {
          current.nextMatchAt = date.toISOString();
        }
      }

      map.set(id, current);
    }
  }

  return [...map.values()]
    .map((team) => ({
      ...team,
      leagueIds: [...team.leagueIds],
      stats: teamStatsForMatches(team.id, matches),
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

export async function getTeamCatalog() {
  return buildTeamCatalog(await getMatchSnapshot());
}

export async function getTeamById(id) {
  const wanted = String(id || "").trim();
  if (!wanted) return null;
  const teams = await getTeamCatalog();
  return teams.find((team) => team.id === wanted) || null;
}

export async function getTeamMatches(id) {
  const wanted = String(id || "").trim();
  if (!wanted) return [];
  const matches = await getMatchSnapshot();
  return matches.filter((match) => (
    teamIdentity(match?.teams?.home) === wanted ||
    teamIdentity(match?.teams?.away) === wanted
  ));
}
\n