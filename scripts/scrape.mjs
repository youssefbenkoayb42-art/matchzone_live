import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "data", "scraped-matches.json");
const OLD_LOGO_DIR = path.join(ROOT, "public", "teams");

const API = "https://api.football-data.org/v4";
const TOKEN = String(process.env.FOOTBALL_DATA_API_KEY || "").trim();

const AVATAR_BASE = "https://ui-avatars.com/api/";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function cleanHttpsUrl(value) {
  const url = String(value || "").trim();
  return /^https:\/\//i.test(url) ? url : null;
}

/*
 * Absolute identity rule:
 * - team.id is the only identity key.
 * - team.name is display-only.
 * - crest belongs to that exact football-data.org team ID.
 * - missing/invalid ID or crest => UI Avatar.
 *
 * No name search, slug matching, local filename matching, cache lookup,
 * registry lookup, Flashscore data, or secondary logo provider exists here.
 */
function teamFromApi(team, identityLogos) {
  const id = Number.isInteger(team?.id) ? team.id : null;
  const name = String(team?.name || team?.shortName || "Unknown Team").trim();
  const crest = cleanHttpsUrl(team?.crest);

  if (!id || !crest) {
    return {
      id,
      footballDataId: id,
      name,
      logo: avatar(name),
      logoPath: avatar(name),
      logoSource: "UI Avatars",
      logoQuality: "avatar",
    };
  }

  const previous = identityLogos.get(id);

  if (previous && previous !== crest) {
    console.warn("[IDENTITY] conflicting crest for team ID", id, "=> avatar");
    const safe = avatar(name);
    identityLogos.set(id, safe);
    return {
      id,
      footballDataId: id,
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
    name,
    logo: crest,
    logoPath: crest,
    logoSource: "Football-Data.org team ID",
    logoQuality: "verified-id",
  };
}

function sanitizeMatches(matches) {
  const logoOwners = new Map();
  const identityLogos = new Map();

  const prepared = matches.map((raw) => {
    const home = teamFromApi(raw.homeTeam, identityLogos);
    const away = teamFromApi(raw.awayTeam, identityLogos);

    return {
      fixture: {
        id: Number(raw.id),
        date: raw.utcDate,
        status: { short: status(raw.status) },
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
      source: "football-data.org",
      externalId: Number(raw.id),
      externalIds: { "football-data.org": Number(raw.id) },
      details: {
        events: [],
        statistics: [],
        updatedAt: null,
        source: "football-data.org",
      },
    };
  });

  // Absolute datastore sanitation:
  // different team IDs may never share the same logo URL.
  for (const match of prepared) {
    const teams = [match.teams.home, match.teams.away];

    for (const team of teams) {
      const id = Number(team?.footballDataId || team?.id || 0);
      const logo = String(team?.logo || "").trim();
      if (!id || !logo) continue;

      const owner = logoOwners.get(logo);
      if (owner && owner !== id) {
        console.warn(
          "[SANITIZE] shared logo rejected:",
          logo,
          "team IDs:",
          owner,
          id
        );

        const affectedIds = [owner, id];

        for (const item of prepared) {
          for (const side of ["home", "away"]) {
            const current = item.teams[side];
            const currentId = Number(
              current?.footballDataId || current?.id || 0
            );

            if (affectedIds.includes(currentId)) {
              const safe = avatar(current.name);
              current.logo = safe;
              current.logoPath = safe;
              current.logoSource = "UI Avatars";
              current.logoQuality = "collision-sanitized";
            }
          }
        }

        logoOwners.delete(logo);
        continue;
      }

      logoOwners.set(logo, id);
    }
  }

  // Final fixture-level guard.
  for (const match of prepared) {
    const home = match.teams.home;
    const away = match.teams.away;
    const homeId = Number(home?.footballDataId || home?.id || 0);
    const awayId = Number(away?.footballDataId || away?.id || 0);

    if (
      homeId &&
      awayId &&
      homeId !== awayId &&
      home.logo &&
      away.logo &&
      home.logo === away.logo
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

async function fetchMatches() {
  if (!TOKEN) {
    throw new Error("FOOTBALL_DATA_API_KEY is missing.");
  }

  const now = new Date();
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - 2);

  const to = new Date(now);
  to.setUTCDate(to.getUTCDate() + 7);

  const dateFrom = from.toISOString().slice(0, 10);
  const dateTo = to.toISOString().slice(0, 10);

  const url =
    API +
    "/matches?dateFrom=" +
    encodeURIComponent(dateFrom) +
    "&dateTo=" +
    encodeURIComponent(dateTo);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": TOKEN,
        Accept: "application/json",
        "User-Agent": "MatchZone/2.0",
      },
    });

    if (response.status === 429 && attempt === 1) {
      console.warn("[API] rate limit; waiting 60 seconds...");
      await sleep(60000);
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error("Football-Data HTTP " + response.status + ": " + body.slice(0, 300));
    }

    const data = await response.json();
    return Array.isArray(data?.matches) ? data.matches : [];
  }

  return [];
}

async function main() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  // Remove every old local logo artifact. No local logo cache is used anymore.
  await fs.rm(OLD_LOGO_DIR, { recursive: true, force: true });

  const rawMatches = await fetchMatches();

  if (!rawMatches.length) {
    throw new Error("No matches returned; refusing to replace the live datastore.");
  }

  const matches = sanitizeMatches(rawMatches);

  const payload = {
    schemaVersion: 2,
    updatedAt: new Date().toISOString(),
    source: "football-data.org",
    logoPolicy: {
      identityKey: "football-data.org team ID",
      nameLookup: false,
      localLogoCache: false,
      secondaryLogoProvider: false,
      collisionPolicy: "different team IDs sharing a logo are replaced by UI Avatars",
      unknownTeamPolicy: "UI Avatars",
    },
    matchCount: matches.length,
    leagueCount: new Set(
      matches.map((m) => String(m.league?.id || "")).filter(Boolean)
    ).size,
    matches,
  };

  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log("[CLEAN-SCRAPER] source:", payload.source);
  console.log("[CLEAN-SCRAPER] matches:", payload.matchCount);
  console.log("[CLEAN-SCRAPER] leagues:", payload.leagueCount);
  console.log("[CLEAN-SCRAPER] local logo directory purged.");
  console.log("[CLEAN-SCRAPER] identity model: football-data.org numeric team IDs.");
}

main().catch((error) => {
  console.error("[CLEAN-SCRAPER] FAILED:", error);
  process.exit(1);
});

// CLEAN ID-ONLY REBUILD TRIGGER
