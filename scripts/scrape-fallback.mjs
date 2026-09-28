import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const BASE = "https://www.flashscore.com";
const OUTPUT = path.join(process.cwd(), "data", "scraped-matches.json");
const LOGO_REGISTRY_OUTPUT = path.join(process.cwd(), "data", "team-logo-registry.json");
// Keep the scraper workflow triggerable after datastore-only fixes.
const TEAM_LOGO_DIR = path.join(process.cwd(), "public", "teams");
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
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123";
const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";
const FOOTBALL_DATA_API_KEY = String(process.env.FOOTBALL_DATA_API_KEY || "").trim();
// GitHub Actions supplies this through secrets.FOOTBALL_DATA_API_KEY; local runs may set it directly.
const VERCEL_TEAM_CDN = "https://matchzone-live.vercel.app/teams";
const logoCache = new Map();
const localLogoCache = new Map();
const identityLogoCache = new Map();
const fallbackIdentityCache = new Map();
const KNOWN_DIRTY_FLASHSCORE_SLUGS = new Set([
  "widad-temara",
  "wydad-ac",
  "wydad-athletic",
  "cod-meknes",
  "codm-de-meknes",
  "difaa-el-jadidi",
]);
let logoRegistry = { version: 1, updatedAt: null, teams: {}, providerIndex: {} };
let sportsDbRateLimited = false;


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logoExtensionFromUrl(value) {
  try {
    const pathname = new URL(String(value || "")).pathname.toLowerCase();
    const match = pathname.match(/\.(png|jpg|jpeg|webp|svg)$/i);
    return match ? match[1].toLowerCase() : "png";
  } catch {
    return "png";
  }
}

function localLogoKey(teamName) {
  return normalizeName(teamName);
}

async function loadLogoRegistry() {
  try {
    const parsed = JSON.parse(await fs.readFile(LOGO_REGISTRY_OUTPUT, "utf8"));
    const rawTeams = parsed.teams && typeof parsed.teams === "object" ? parsed.teams : {};

    // HARD RESET: quarantine every known-problem Flashscore identity on load.
    // These identities are rebuilt only after the strict name/slug guard passes.
    const teams = Object.fromEntries(
      Object.entries(rawTeams).filter(([canonicalId, entry]) => {
        if (entry?.provider !== "flashscore") return true;
        const providerId = normalizeFlashscoreSlug(entry?.providerId);
        if (KNOWN_DIRTY_FLASHSCORE_SLUGS.has(providerId)) return false;

        const requested = normalizeName(entry?.name);
        const provider = normalizeName(providerId);
        const knownMismatch =
          (requested === "widadtemara" && provider !== "widadtemara") ||
          (requested === "wydadac" && provider !== "wydadac" && provider !== "wydadathletic") ||
          (requested === "codmeknes" && provider !== "codmeknes" && provider !== "codmde-meknes") ||
          (requested === "difaaeljadidi" && provider !== "difaaeljadidi");

        return !knownMismatch && !/^\d+$/.test(String(entry?.providerId || ""));
      })
    );

    const providerIndex = Object.fromEntries(
      Object.entries(
        parsed.providerIndex && typeof parsed.providerIndex === "object"
          ? parsed.providerIndex
          : {}
      ).filter(([, canonicalId]) => teams[canonicalId])
    );

    logoRegistry = {
      version: 1,
      updatedAt: parsed.updatedAt || null,
      teams,
      providerIndex,
    };
  } catch {
    logoRegistry = { version: 1, updatedAt: null, teams: {}, providerIndex: {} };
  }
}

async function saveLogoRegistry() {
  logoRegistry.updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(LOGO_REGISTRY_OUTPUT), { recursive: true });
  await fs.writeFile(LOGO_REGISTRY_OUTPUT, JSON.stringify(logoRegistry, null, 2) + "\n", "utf8");
}

async function loadLocalTeamLogos() {
  await fs.mkdir(TEAM_LOGO_DIR, { recursive: true });
  await loadLogoRegistry();
  localLogoCache.clear();
  identityLogoCache.clear();

  for (const [canonicalId, entry] of Object.entries(logoRegistry.teams)) {
    if (entry?.logoPath) identityLogoCache.set(canonicalId, entry.logoPath);
  }

  const entries = await fs.readdir(TEAM_LOGO_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = entry.name.match(/^(.+)\.(png|jpg|jpeg|webp|svg)$/i);
    if (!match) continue;
    localLogoCache.set(match[1], "/teams/" + entry.name);
  }
  console.log("[scraper] identity logo registry:", Object.keys(logoRegistry.teams).length);
  console.log("[scraper] legacy local team logos:", localLogoCache.size);
  console.log("[scraper] Vercel team CDN:", VERCEL_TEAM_CDN);
}

function providerKey(provider, id) {
  const value = String(id || "").trim();
  return value ? String(provider || "").toLowerCase() + ":" + value : null;
}

function canonicalTeamId(provider, id) {
  const key = providerKey(provider, id);
  if (!key) return null;
  return logoRegistry.providerIndex[key] || key.replace(/[^a-z0-9:_-]/gi, "_");
}

function mimeFromExtension(extension) {
  const value = String(extension || "").toLowerCase();
  if (value === "jpg" || value === "jpeg") return "image/jpeg";
  if (value === "webp") return "image/webp";
  if (value === "svg") return "image/svg+xml";
  return "image/png";
}

async function saveIdentityTeamLogo({ provider, providerTeamId, teamName, logoUrl, overwrite = false }) {
  const providerName = String(provider || "").trim().toLowerCase();
  const id = String(providerTeamId || "").trim();
  const cleanUrl = cleanTeamLogo(logoUrl);
  if (!providerName || !id || !teamName || !cleanUrl) return null;

  const pKey = providerKey(providerName, id);
  const canonicalId = canonicalTeamId(providerName, id);
  if (!pKey || !canonicalId) return null;

  const existingEntry = logoRegistry.teams[canonicalId] || {};
  if (existingEntry.logoPath && !overwrite) {
    identityLogoCache.set(canonicalId, existingEntry.logoPath);
    return existingEntry.logoPath;
  }

  try {
    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: "https://www.flashscore.com/",
      },
    });
    if (!response.ok) throw new Error("logo HTTP " + response.status);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) throw new Error("empty logo");

    const extension = logoExtensionFromUrl(cleanUrl);
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    const filename = canonicalId.replace(/[^a-z0-9_-]/gi, "_") + "." + extension;
    const filePath = path.join(TEAM_LOGO_DIR, filename);
    await fs.writeFile(filePath, buffer);

    const duplicateHash = Object.entries(logoRegistry.teams).find(
      ([otherId, entry]) => otherId !== canonicalId && entry?.sha256 === hash
    );

    if (duplicateHash && providerName === "flashscore") {
      console.warn("[logo] duplicate hash across identities:", canonicalId, duplicateHash[0]);
    }

    logoRegistry.teams[canonicalId] = {
      ...existingEntry,
      canonicalId,
      name: teamName,
      provider: providerName,
      providerId: id,
      logoUrl: cleanUrl,
      logoPath: "/teams/" + filename,
      sha256: hash,
      bytes: buffer.length,
      mime: mimeFromExtension(extension),
      status: duplicateHash ? "review" : "verified",
      updatedAt: new Date().toISOString(),
    };
    logoRegistry.providerIndex[pKey] = canonicalId;
    identityLogoCache.set(canonicalId, "/teams/" + filename);
    return "/teams/" + filename;
  } catch (error) {
    console.warn("[logo] identity download failed", providerName, id, teamName, error.message);
    return null;
  }
}

async function saveLocalTeamLogo(teamName, logoUrl, options = {}) {
  const key = localLogoKey(teamName);
  if (!key || !logoUrl) return null;
  const overwrite = Boolean(options.overwrite);
  const existing = localLogoCache.get(key);
  if (existing && !overwrite) return existing;
  try {
    const response = await fetch(logoUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: "https://www.flashscore.com/",
      },
    });
    if (!response.ok) throw new Error("logo HTTP " + response.status);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) throw new Error("empty logo");
    const extension = logoExtensionFromUrl(logoUrl);
    const filename = key + "." + extension;
    await fs.writeFile(path.join(TEAM_LOGO_DIR, filename), buffer);
    const publicPath = "/teams/" + filename;
    localLogoCache.set(key, publicPath);
    return publicPath;
  } catch (error) {
    console.warn("[scraper] legacy local logo download failed", teamName, error.message);
    return null;
  }
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

function cleanTeamLogo(value) {
  const logo = String(value || "").trim();
  if (!/^https?:\/\//i.test(logo)) return null;

  // Flashscore may return placeholder values such as "1" in OB/AW.
  // They are not real team logos and must never be persisted.
  try {
    const pathname = new URL(logo).pathname.toLowerCase();
    const filename = pathname.split("/").pop() || "";
    if (!filename || filename === "1" || filename === "0") return null;
    if (!/\.(png|jpg|jpeg|webp|svg)$/i.test(filename)) return null;
  } catch {
    return null;
  }

  return logo;
}

function normalizeFlashscoreSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-");
}

function teamNameTokens(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((token) => !["fc", "cf", "sc", "afc", "ac", "club", "de", "el", "the"].includes(token));
}

function strictTeamNameMatchesSlug(teamName, slug) {
  const requested = teamNameTokens(teamName);
  const candidate = teamNameTokens(slug);
  if (!requested.length || !candidate.length) return false;

  // Every distinctive requested token must exist in the candidate slug.
  // This intentionally rejects famous-name collisions such as:
  // "Widad Temara" -> "wydad-ac".
  const candidateSet = new Set(candidate);
  const allRequestedTokensPresent = requested.every((token) => candidateSet.has(token));
  if (!allRequestedTokensPresent) return false;

  // Require at least one exact distinctive anchor for short names too.
  const distinctiveRequested = requested.filter((token) => token.length >= 3);
  if (!distinctiveRequested.length) return false;
  return distinctiveRequested.some((token) => candidateSet.has(token));
}

function makeTeamFallbackLogo(teamName) {
  const name = String(teamName || "Team").trim() || "Team";
  return (
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(name) +
    "&length=1&size=128&background=07100d&color=ffffff&bold=true&format=svg"
  );
}

function clearInvalidFlashscoreIdentity(team, reason) {
  if (!team) return team;
  const slug = normalizeFlashscoreSlug(team.flashscoreSlug);
  if (!slug || strictTeamNameMatchesSlug(team.name, slug)) return team;

  console.warn("[logo][STRICT-REJECT]", team.name, "->", slug, reason || "name/slug mismatch");
  team.flashscoreSlug = null;
  team.flashscoreId = null;
  team.teamIdentityId = null;
  team.flashscoreLogo = null;
  team.logo = null;
  team.logoPath = null;
  team.logoSource = null;
  team.logoQuality = "rejected";
  team.logoQualityReason = reason || "flashscore slug does not strictly match team name";
  return team;
}

function sanitizeInvalidFlashscoreIdentities(matches) {
  return matches.map((match) => ({
    ...match,
    teams: {
      home: clearInvalidFlashscoreIdentity({ ...(match.teams?.home || {}) }),
      away: clearInvalidFlashscoreIdentity({ ...(match.teams?.away || {}) }),
    },
  }));
}

function buildTeam(side, id, name, logoFilename, slug) {
  const flashscoreId = String(id || "").trim() || null;
  const rawSlug = normalizeFlashscoreSlug(slug);
  const slugAccepted = Boolean(rawSlug && strictTeamNameMatchesSlug(name, rawSlug));

  if (rawSlug && !slugAccepted) {
    console.warn("[logo][STRICT-REJECT] feed slug rejected:", name, "->", rawSlug);
  }

  const flashscoreSlug = slugAccepted ? rawSlug : null;
  const logo = slugAccepted ? cleanTeamLogo(flashscoreLogo(logoFilename)) : null;

  return {
    id: flashscoreId,
    flashscoreId: slugAccepted ? flashscoreId : null,
    flashscoreSlug,
    teamIdentityId: flashscoreSlug ? canonicalTeamId("flashscore", flashscoreSlug) : null,
    name: name || "",
    logo,
    flashscoreLogo: logo,
    logoFilename: slugAccepted ? String(logoFilename || "").trim() || null : null,
    logoSide: side,
    logoQuality: slugAccepted ? "strict-pass" : "rejected",
  };
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
      // Explicit Flashscore mapping: AU/AE/OB = home, AV/AF/AW = away.
      // Never infer team side from DOM/logo order.
      home: buildTeam("home", record.AU, record.AE, record.OB, record.WU),
      away: buildTeam("away", record.AV, record.AF, record.AW, record.WV),
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

async function fetchFootballDataMatches(dateFrom, dateTo, retry = true) {
  if (!FOOTBALL_DATA_API_KEY) {
    console.warn("[scraper] FOOTBALL_DATA_API_KEY is not available in GitHub Actions; skipping official logo lookup.");
    return [];
  }

  const url =
    FOOTBALL_DATA_BASE +
    "/matches?dateFrom=" +
    encodeURIComponent(dateFrom) +
    "&dateTo=" +
    encodeURIComponent(dateTo);

  try {
    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": FOOTBALL_DATA_API_KEY,
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
    });

    if (response.status === 429) {
      console.warn("[scraper] Football-Data.org returned 429; waiting 60 seconds before retry.");
      if (!retry) return [];
      await sleep(60000);
      return fetchFootballDataMatches(dateFrom, dateTo, false);
    }

    if (!response.ok) {
      throw new Error("Football-Data.org HTTP " + response.status);
    }

    const data = await response.json();
    return Array.isArray(data?.matches) ? data.matches : [];
  } catch (error) {
    console.warn("[scraper] Football-Data.org lookup failed:", error.message);
    return [];
  }
}

function footballDataNameCandidates(team) {
  return new Set(
    [
      team?.name,
      team?.shortName,
      String(team?.name || "").replace(/\bFC\b/gi, "").trim(),
    ]
      .filter(Boolean)
      .map(normalizeName)
      .filter(Boolean)
  );
}

async function enrichFromFootballData(matches) {
  if (!FOOTBALL_DATA_API_KEY || !matches.length) return matches;

  const dates = matches
    .map((match) => String(match.fixture?.date || "").slice(0, 10))
    .filter(Boolean)
    .sort();

  if (!dates.length) return matches;

  const dateFrom = dates[0];
  const dateTo = dates[dates.length - 1];
  console.log("[scraper] official Football-Data.org logo window:", dateFrom, "to", dateTo);

  // One broad request is intentionally used instead of one request per club.
  // The free plan is limited to 10 requests/minute, so batching is essential.
  const apiMatches = await fetchFootballDataMatches(dateFrom, dateTo);
  const byName = new Map();

  for (const item of apiMatches) {
    for (const side of ["homeTeam", "awayTeam"]) {
      const apiTeam = item?.[side];
      if (!apiTeam?.crest) continue;
      for (const key of footballDataNameCandidates(apiTeam)) {
        if (!byName.has(key)) {
          byName.set(key, {
            name: apiTeam.name,
            crest: apiTeam.crest,
            id: apiTeam.id || null,
          });
        }
      }
    }
  }

  console.log("[scraper] Football-Data.org teams with usable crests:", byName.size);

  for (const match of matches) {
    for (const side of ["home", "away"]) {
      const team = match.teams?.[side];
      if (!team?.name) continue;
      if (team.teamIdentityId) continue;
      if (cleanTeamLogo(team.logo || team.flashscoreLogo)) continue;

      const apiTeam = byName.get(normalizeName(team.name));
      if (!apiTeam?.id) continue;

      const localPath = await saveIdentityTeamLogo({
        provider: "football-data",
        providerTeamId: apiTeam.id,
        teamName: team.name,
        logoUrl: apiTeam.crest,
      });
      if (localPath) {
        team.logo = localPath;
        team.logoPath = localPath;
        team.logoSource = "Football-Data.org ID → GitHub registry";
        team.footballDataId = apiTeam.id;
        team.teamIdentityId = canonicalTeamId("football-data", apiTeam.id);
      }
    }
  }

  return matches;
}

async function fetchSportsDBLogo(teamName) {
  const name = String(teamName || "").trim();
  if (!name) return null;
  const cacheKey = normalizeName(name);
  if (logoCache.has(cacheKey)) return logoCache.get(cacheKey);
  if (sportsDbRateLimited) return null;

  try {
    // Do NOT consult the legacy name-based /public/teams cache here.
    // The fallback must be created from an exact TheSportsDB result + unique id.
    const url = SPORTSDB_BASE + "/searchteams.php?t=" + encodeURIComponent(name);
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" }
    });
    if (!response.ok) throw new Error("TheSportsDB HTTP " + response.status);

    const data = await response.json();
    const teams = Array.isArray(data?.teams) ? data.teams : [];
    const wanted = normalizeName(name);
    const exactMatches = teams.filter((team) => normalizeName(team?.strTeam) === wanted);
    const uniqueIds = [...new Set(exactMatches.map((team) => String(team?.idTeam || "")).filter(Boolean))];

    if (uniqueIds.length !== 1) {
      console.warn("[logo][STRICT-FALLBACK-REJECT] TheSportsDB ambiguous/no exact ID:", name, uniqueIds);
      logoCache.set(cacheKey, null);
      return null;
    }

    const best = exactMatches.find((team) => String(team?.idTeam || "") === uniqueIds[0]);
    const logo = best?.strBadge || best?.strTeamBadge || null;
    const teamId = best?.idTeam || null;

    if (!best || !teamId || !logo) {
      console.warn("[logo][STRICT-FALLBACK-REJECT] TheSportsDB exact team has no badge:", name, teamId);
      logoCache.set(cacheKey, null);
      return null;
    }

    const localLogoPath = await saveIdentityTeamLogo({
      provider: "thesportsdb",
      providerTeamId: teamId,
      teamName: best.strTeam || name,
      logoUrl: logo,
      overwrite: true,
    });

    if (!localLogoPath) {
      logoCache.set(cacheKey, null);
      return null;
    }

    const identityId = canonicalTeamId("thesportsdb", teamId);
    fallbackIdentityCache.set(cacheKey, identityId);
    logoCache.set(cacheKey, localLogoPath);
    return localLogoPath;
  } catch (error) {
    if (String(error?.message || "").includes("429")) {
      sportsDbRateLimited = true;
      console.warn("[scraper] TheSportsDB rate limit reached; stopping further logo requests for this run.");
    } else {
      console.warn("[scraper] logo lookup failed", name, error.message);
    }
    logoCache.set(cacheKey, null);
    return null;
  }
}

function repairDuplicateTeamLogos(matches) {
  return matches.map((match) => {
    const home = { ...(match.teams?.home || {}) };
    const away = { ...(match.teams?.away || {}) };
    const homeLogo = cleanTeamLogo(home.logo || home.flashscoreLogo);
    const awayLogo = cleanTeamLogo(away.logo || away.flashscoreLogo);
    const differentTeams =
      String(home.id || "") !== String(away.id || "") ||
      normalizeName(home.name) !== normalizeName(away.name);

    // A legacy scrape could have copied the home badge into the away slot.
    // Keep the current home badge, but remove the stale away badge so the
    // enrichment step can fetch the real away team's badge.
    if (differentTeams && homeLogo && awayLogo && homeLogo === awayLogo) {
      away.logo = null;
      away.flashscoreLogo = null;
      away.logoFilename = null;
      away.logoSource = null;
    }

    return {
      ...match,
      teams: { home, away },
    };
  });
}

async function enrichTeamLogos(matches) {
  const result = sanitizeInvalidFlashscoreIdentities(repairDuplicateTeamLogos(matches)).map((match) => ({
    ...match,
    teams: {
      home: { ...(match.teams?.home || {}) },
      away: { ...(match.teams?.away || {}) },
    },
  }));

  await loadLocalTeamLogos();
  fallbackIdentityCache.clear();

  const refreshedFlashscoreLogos = new Set();

  // STEP 1 — Flashscore only when the slug passes the strict requested-name guard.
  for (const match of result) {
    for (const side of ["home", "away"]) {
      const team = match.teams?.[side];
      if (!team?.name) continue;

      const flashscoreSlug = normalizeFlashscoreSlug(team.flashscoreSlug);
      if (!flashscoreSlug || !strictTeamNameMatchesSlug(team.name, flashscoreSlug)) {
        clearInvalidFlashscoreIdentity(team, "strict guard rejected Flashscore slug");
        continue;
      }

      const freshFlashscoreLogo = cleanTeamLogo(team.flashscoreLogo);
      if (freshFlashscoreLogo && !refreshedFlashscoreLogos.has(flashscoreSlug)) {
        const localPath = await saveIdentityTeamLogo({
          provider: "flashscore",
          providerTeamId: flashscoreSlug,
          teamName: team.name,
          logoUrl: freshFlashscoreLogo,
          overwrite: true,
        });
        if (localPath) {
          refreshedFlashscoreLogos.add(flashscoreSlug);
          team.logo = localPath;
          team.logoPath = localPath;
          team.teamIdentityId = canonicalTeamId("flashscore", flashscoreSlug);
          team.logoSource = "Flashscore strict slug → GitHub registry";
          team.logoQuality = "strict-pass";
          continue;
        }
      }

      const identityId = canonicalTeamId("flashscore", flashscoreSlug);
      const identityPath = identityId ? identityLogoCache.get(identityId) : null;
      if (identityPath) {
        team.logo = identityPath;
        team.logoPath = identityPath;
        team.teamIdentityId = identityId;
        team.logoSource = "GitHub identity registry";
        team.logoQuality = "strict-pass";
      }
    }
  }

  // STEP 2 — Official Football-Data.org for missing teams.
  // Matching is exact and ambiguous names are rejected; only the returned
  // Football-Data team ID becomes the registry identity.
  await enrichFromFootballData(result);

  // STEP 3 — TheSportsDB exact-name + unique idTeam fallback.
  const unique = new Map();
  for (const match of result) {
    for (const side of ["home", "away"]) {
      const team = match.teams?.[side];
      if (!team?.name) continue;

      if (team.teamIdentityId && identityLogoCache.get(team.teamIdentityId)) {
        team.logo = identityLogoCache.get(team.teamIdentityId);
        team.logoPath = team.logo;
        continue;
      }

      const key = normalizeName(team.name);
      if (!unique.has(key)) unique.set(key, team.name);
    }
  }

  console.log("[scraper] teams needing strict TheSportsDB fallback:", unique.size);

  for (const [key, name] of unique) {
    const logo = await fetchSportsDBLogo(name);
    if (logo) logoCache.set(key, logo);
    await sleep(2000);
  }

  // Apply TheSportsDB ID-backed fallbacks to the actual team records.
  for (const match of result) {
    for (const side of ["home", "away"]) {
      const team = match.teams?.[side];
      if (!team?.name) continue;
      if (team.teamIdentityId && identityLogoCache.get(team.teamIdentityId)) continue;

      const key = normalizeName(team.name);
      const pathFromFallback = logoCache.get(key);
      const fallbackIdentity = fallbackIdentityCache.get(key);
      if (pathFromFallback && fallbackIdentity) {
        team.logo = pathFromFallback;
        team.logoPath = pathFromFallback;
        team.teamIdentityId = fallbackIdentity;
        team.logoSource = "TheSportsDB exact name + idTeam → GitHub registry";
        team.logoQuality = "fallback-id";
      }
    }
  }

  // STEP 4 — authoritative identity lock, then hard collision guard.
  for (const match of result) {
    const home = match.teams?.home;
    const away = match.teams?.away;

    for (const team of [home, away]) {
      if (!team?.teamIdentityId) continue;
      const locked = identityLogoCache.get(team.teamIdentityId);
      if (locked) {
        team.logo = locked;
        team.logoPath = locked;
        team.logoSource = team.logoSource || "GitHub identity registry (locked)";
      }
    }

    enforceFixtureLogoQuality(match);
  }

  return result;
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
    await sleep(2000);
  }
  console.log("[scraper] saved details for", details.size, "matches");
  return details;
}

function mergeTeam(existingTeam, incomingTeam, side) {
  const existing = existingTeam || {};
  const incoming = incomingTeam || {};
  const sameIdentity =
    String(existing.id || "") === String(incoming.id || "") &&
    normalizeName(existing.name) === normalizeName(incoming.name);

  const incomingLogo = cleanTeamLogo(incoming.logo || incoming.flashscoreLogo);
  const incomingFilename = String(incoming.logoFilename || "").trim();
  const hasIncomingLogoSignal = Boolean(incomingFilename);
  const existingLogo = sameIdentity ? cleanTeamLogo(existing.logo || existing.flashscoreLogo) : null;

  // Flashscore's OB/AW fields are side-specific. If the fresh feed explicitly
  // supplied a filename (including its placeholder "1"/"0"), never resurrect
  // an older logo from the same team record. A stale logo here can otherwise
  // put the home badge on the away side forever when AW is invalid.
  const mergedLogo = incomingLogo || (hasIncomingLogoSignal ? null : existingLogo);
  const mergedFlashscoreLogo =
    cleanTeamLogo(incoming.flashscoreLogo) ||
    (hasIncomingLogoSignal ? null : (sameIdentity ? cleanTeamLogo(existing.flashscoreLogo) : null));

  return {
    ...existing,
    ...incoming,
    id: incoming.id || existing.id || null,
    name: incoming.name || existing.name || "",
    logo: mergedLogo,
    flashscoreLogo: mergedFlashscoreLogo,
    logoFilename: incomingFilename || (sameIdentity ? existing.logoFilename : null),
    logoSide: side,
  };
}

function mergeFeedMatches(existing, incoming) {
  const home = mergeTeam(existing.teams?.home, incoming.teams?.home, "home");
  const away = mergeTeam(existing.teams?.away, incoming.teams?.away, "away");

  // Never allow a stale/incorrect shared logo to be copied to both sides.
  if (home.logo && away.logo && home.logo === away.logo) {
    const incomingHome = cleanTeamLogo(incoming.teams?.home?.logo);
    const incomingAway = cleanTeamLogo(incoming.teams?.away?.logo);
    if (incomingHome && incomingAway && incomingHome !== incomingAway) {
      home.logo = incomingHome;
      away.logo = incomingAway;
    } else if (incomingHome) {
      home.logo = incomingHome;
      away.logo = null;
      away.flashscoreLogo = null;
      away.logoFilename = null;
    } else if (incomingAway) {
      away.logo = incomingAway;
      home.logo = null;
      home.flashscoreLogo = null;
      home.logoFilename = null;
    } else {
      away.logo = null;
      away.flashscoreLogo = null;
      away.logoFilename = null;
    }
  }

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
    teams: { home, away },
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

function enforceFixtureLogoQuality(match) {
  if (!match?.teams) return match;
  const home = match.teams.home || {};
  const away = match.teams.away || {};

  const homeName = String(home.name || "Home");
  const awayName = String(away.name || "Away");
  const differentTeams =
    normalizeName(homeName) !== normalizeName(awayName) ||
    String(home.teamIdentityId || "") !== String(away.teamIdentityId || "");

  if (!differentTeams) return match;

  const homePath = String(home.logoPath || home.logo || "").trim();
  const awayPath = String(away.logoPath || away.logo || "").trim();

  if (homePath && awayPath && homePath === awayPath) {
    console.warn("[logo][COLLISION-GUARD] identical home/away logo invalidated:", match.fixture?.id, homeName, awayName);

    home.logo = makeTeamFallbackLogo(homeName);
    home.logoPath = home.logo;
    home.flashscoreLogo = null;
    home.logoSource = "UI Avatars collision fallback";
    home.logoQuality = "collision-fallback";

    away.logo = makeTeamFallbackLogo(awayName);
    away.logoPath = away.logo;
    away.flashscoreLogo = null;
    away.logoSource = "UI Avatars collision fallback";
    away.logoQuality = "collision-fallback";
  }

  return match;
}

function enforceDatastoreLogoQuality(matches) {
  return matches.map((match) => {
    const sanitized = sanitizeInvalidFlashscoreIdentities([match])[0];
    enforceFixtureLogoQuality(sanitized);
    return sanitized;
  });
}

function dedupe(matches) {
  const byId = new Map();
  const byFixture = new Map();

  for (const match of matches) {
    const id = String(match.fixture?.id || "");
    const fixtureKey = [
      match.fixture?.date?.slice(0, 10),
      String(match.teams?.home?.id || ""),
      normalizeName(match.teams?.home?.name),
      String(match.teams?.away?.id || ""),
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
  await loadLocalTeamLogos();

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

  // Hard sanitize legacy poisoned identities BEFORE any enrichment.
  // This guarantees a previous wrong logo cannot survive into the new run.
  const sanitizedBase = sanitizeInvalidFlashscoreIdentities(baseMerged);
  const repairedBase = repairDuplicateTeamLogos(sanitizedBase);
  const enrichedBase = await enrichTeamLogos(repairedBase);
  const detailMap = await scrapeMatchDetails(scraped);

  const merged = enrichedBase.map((match) => {
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

  const qualityCheckedMatches = enforceDatastoreLogoQuality(merged);

  const payload = {
    updatedAt: new Date().toISOString(),
    source: scraped.some((m) => m.source === "Flashscore Feed") ? "flashscore-feed" : "flashscore-html",
    leagueCount: LEAGUES.length,
    matchCount: qualityCheckedMatches.length,
    detailMatchCount: qualityCheckedMatches.filter((m) => (m.details?.events?.length || 0) + (m.details?.statistics?.length || 0) > 0).length,
    matches: qualityCheckedMatches,
  };

  await fs.writeFile(OUTPUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  await saveLogoRegistry();
  console.log("[scraper] logo registry saved:", Object.keys(logoRegistry.teams).length, "identities");
  console.log("[scraper] saved", merged.length, "unique matches from", LEAGUES.length, "competitions");
}

main().catch((error) => {
  console.error(error);