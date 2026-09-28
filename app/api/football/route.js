export const dynamic = "force-dynamic";

const API = "https://api.football-data.org/v4";
const AVATAR_BASE = "https://ui-avatars.com/api/";

function avatar(name) {
  const value = String(name || "Team").trim() || "Team";
  return (
    AVATAR_BASE +
    "?name=" + encodeURIComponent(value) +
    "&length=1&size=128&background=07100d&color=ffffff&bold=true&format=svg"
  );
}

function status(value) {
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

function url(value) {
  const valueString = String(value || "").trim();
  return /^https:\/\//i.test(valueString) ? valueString : null;
}

function team(team) {
  const id = Number.isInteger(team?.id) ? team.id : null;
  const name = String(team?.name || team?.shortName || "Unknown Team").trim();
  const crest = url(team?.crest);

  if (!id || !crest) {
    const safe = avatar(name);
    return {
      id,
      footballDataId: id,
      name,
      logo: safe,
      logoPath: safe,
      logoSource: "UI Avatars",
      logoQuality: "avatar",
    };
  }

  return {
    id,
    footballDataId: id,
    name,
    logo: crest,
    logoPath: crest,
    logoSource: "Football-Data.org team ID",
    logoQuality: "verified-id",
  };
}

function format(match) {
  const home = team(match.homeTeam);
  const away = team(match.awayTeam);

  return {
    fixture: {
      id: Number(match.id),
      date: match.utcDate,
      status: { short: status(match.status) },
    },
    teams: { home, away },
    goals: {
      home: match.score?.fullTime?.home ?? match.score?.regularTime?.home ?? null,
      away: match.score?.fullTime?.away ?? match.score?.regularTime?.away ?? null,
    },
    league: {
      id: match.competition?.id ?? null,
      name: match.competition?.name || "Football",
      logo: url(match.competition?.emblem),
    },
    source: "football-data.org",
    externalId: Number(match.id),
    externalIds: { "football-data.org": Number(match.id) },
    competitionType: "domestic",
  };
}

async function fetchMatches() {
  const token = String(process.env.FOOTBALL_DATA_API_KEY || "").trim();
  if (!token) throw new Error("FOOTBALL_DATA_API_KEY is missing");

  const now = new Date();
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - 1);

  const to = new Date(now);
  to.setUTCDate(to.getUTCDate() + 7);

  const endpoint =
    API +
    "/matches?dateFrom=" +
    from.toISOString().slice(0, 10) +
    "&dateTo=" +
    to.toISOString().slice(0, 10);

  const response = await fetch(endpoint, {
    headers: {
      "X-Auth-Token": token,
      Accept: "application/json",
    },
    next: { revalidate: 120 },
  });

  if (!response.ok) {
    throw new Error("Football-Data HTTP " + response.status);
  }

  const raw = Array.isArray(data?.matches) ? data.matches : [];
  const matches = raw.map(format);
  const owners = new Map();
  const collidedIds = new Set();

  for (const match of matches) {
    for (const side of ["home", "away"]) {
      const item = match.teams[side];
      const id = Number(item?.footballDataId || item?.id || 0);
      const logo = String(item?.logo || "").trim();
      if (!id || !logo || logo.startsWith("https://ui-avatars.com/")) continue;
      const owner = owners.get(logo);
      if (owner && owner !== id) {
        collidedIds.add(owner);
        collidedIds.add(id);
      } else {
        owners.set(logo, id);
      }
    }
  }

  for (const match of matches) {
    for (const side of ["home", "away"]) {
      const item = match.teams[side];
      const id = Number(item?.footballDataId || item?.id || 0);
      if (!collidedIds.has(id)) continue;
      const safe = avatar(item.name);
      item.logo = safe;
      item.logoPath = safe;
      item.logoSource = "UI Avatars";
      item.logoQuality = "collision-sanitized";
    }

    const home = match.teams.home;
    const away = match.teams.away;
    if (home.logo === away.logo && home.footballDataId !== away.footballDataId) {
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

  return matches;
}

export async function GET() {
  try {
    const matches = await fetchMatches();

    return Response.json(
      {
        response: matches,
        results: matches.length,
        source: "football-data.org",
        logoPolicy: "strict team ID; unknown or collision => UI Avatars",
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Football data error:", error);
    return Response.json(
      {
        response: [],
        results: 0,
        source: "football-data.org",
        error: "تعذر جلب بيانات المباريات",
      },
      { status: 503 }
    );
  }
}
