const OPENFOOTBALL_BASE =
  "https://raw.githubusercontent.com/openfootball/football.json/master";

export const OPENFOOTBALL_LEAGUES = {
  "premier-league": {
    code: "en.1",
    name: "Premier League",
    arabicName: "الدوري الإنجليزي الممتاز",
    slug: "premier-league",
    file: "en.1.json",
  },
  "la-liga": {
    code: "es.1",
    name: "Spain Primera División",
    arabicName: "الدوري الإسباني",
    slug: "la-liga",
    file: "es.1.json",
  },
  "serie-a": {
    code: "it.1",
    name: "Italian Serie A",
    arabicName: "الدوري الإيطالي",
    slug: "serie-a",
    file: "it.1.json",
  },
  bundesliga: {
    code: "de.1",
    name: "German Bundesliga",
    arabicName: "الدوري الألماني",
    slug: "bundesliga",
    file: "de.1.json",
  },
  "ligue-1": {
    code: "fr.1",
    name: "French Ligue 1",
    arabicName: "الدوري الفرنسي",
    slug: "ligue-1",
    file: "fr.1.json",
  },
};

function seasonPath(slug) {
  const league = OPENFOOTBALL_LEAGUES[slug];
  return league ? league.file : null;
}

async function fetchLeagueFile(slug) {
  const file = seasonPath(slug);
  if (!file) return null;

  const response = await fetch(
    OPENFOOTBALL_BASE + "/2026-27/" + file,
    {
      next: {
        revalidate: 86400,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "OpenFootball request failed: " +
        response.status +
        " for " +
        slug
    );
  }

  const data = await response.json();

  return {
    ...OPENFOOTBALL_LEAGUES[slug],
    data,
  };
}

function matchDateTime(match) {
  const date = match?.date || "";
  const time = match?.time || "00:00";
  return new Date(date + "T" + time + ":00Z");
}

function hasFinalScore(match) {
  const ft = match?.score?.ft;
  return (
    Array.isArray(ft) &&
    ft.length >= 2 &&
    Number.isFinite(Number(ft[0])) &&
    Number.isFinite(Number(ft[1]))
  );
}

function toNormalizedMatch(match, league) {
  const finished = hasFinalScore(match);
  const date = matchDateTime(match);
  const homeScore = finished ? Number(match.score.ft[0]) : null;
  const awayScore = finished ? Number(match.score.ft[1]) : null;

  return {
    fixture: {
      id: Math.abs(
        (match.date + "-" + match.team1 + "-" + match.team2)
          .split("")
          .reduce(
            (hash, char) =>
              ((hash << 5) - hash + char.charCodeAt(0)) | 0,
            0
          )
      ),
      date: date.toISOString(),
      status: {
        short: finished
          ? "FT"
          : date.getTime() <= Date.now()
            ? "NS"
            : "NS",
      },
    },
    teams: {
      home: {
        id: null,
        name: match.team1 || "الفريق المضيف",
        logo: null,
      },
      away: {
        id: null,
        name: match.team2 || "الفريق الضيف",
        logo: null,
      },
    },
    goals: {
      home: homeScore,
      away: awayScore,
    },
    league: {
      id: "openfootball-" + league.code,
      name: league.name,
      logo: null,
    },
    source: "openfootball/football.json",
    competitionType: "domestic",
    openFootballLeague: league.slug,
    round: match.round || null,
    eventId:
      "of-" +
      league.code +
      "-" +
      match.date +
      "-" +
      encodeURIComponent(
        String(match.team1 || "") +
          "-" +
          String(match.team2 || "")
      ),
  };
}

export async function getOpenFootballMatches({
  slugs = Object.keys(OPENFOOTBALL_LEAGUES),
  from = null,
  to = null,
} = {}) {
  const results = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const league = await fetchLeagueFile(slug);
        const matches = Array.isArray(league?.data?.matches)
          ? league.data.matches
          : [];

        return matches
          .filter((match) => {
            if (!from && !to) return true;
            const date = match?.date;
            if (!date) return false;
            if (from && date < from) return false;
            if (to && date > to) return false;
            return true;
          })
          .map((match) => toNormalizedMatch(match, league));
      } catch (error) {
        console.error("OpenFootball " + slug + ":", error);
        return [];
      }
    })
  );

  return results.flat().sort(
    (a, b) =>
      new Date(a.fixture.date).getTime() -
      new Date(b.fixture.date).getTime()
  );
}

function emptyTeam(name) {
  return {
    idTeam: null,
    strTeam: name,
    intPlayed: 0,
    intWin: 0,
    intDraw: 0,
    intLoss: 0,
    intGoalsFor: 0,
    intGoalsAgainst: 0,
    intGoalDifference: 0,
    intPoints: 0,
  };
}

export function buildOpenFootballStandings(matches) {
  const teams = new Map();

  const getTeam = (name) => {
    const key = String(name || "").trim();
    if (!teams.has(key)) {
      teams.set(key, emptyTeam(key));
    }
    return teams.get(key);
  };

  for (const match of matches) {
    if (!hasFinalScore(match)) continue;

    const home = getTeam(match.teams?.home?.name);
    const away = getTeam(match.teams?.away?.name);
    const homeGoals = Number(match.goals?.home);
    const awayGoals = Number(match.goals?.away);

    home.intPlayed += 1;
    away.intPlayed += 1;
    home.intGoalsFor += homeGoals;
    home.intGoalsAgainst += awayGoals;
    away.intGoalsFor += awayGoals;
    away.intGoalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      home.intWin += 1;
      away.intLoss += 1;
      home.intPoints += 3;
    } else if (homeGoals < awayGoals) {
      away.intWin += 1;
      home.intLoss += 1;
      away.intPoints += 3;
    } else {
      home.intDraw += 1;
      away.intDraw += 1;
      home.intPoints += 1;
      away.intPoints += 1;
    }
  }

  const table = Array.from(teams.values())
    .map((team) => ({
      ...team,
      intGoalDifference:
        team.intGoalsFor - team.intGoalsAgainst,
    }))
    .sort(
      (a, b) =>
        b.intPoints - a.intPoints ||
        b.intGoalDifference - a.intGoalDifference ||
        b.intGoalsFor - a.intGoalsFor ||
        a.strTeam.localeCompare(b.strTeam)
    )
    .map((team, index) => ({
      ...team,
      intRank: index + 1,
    }));

  return table;
}

export async function getOpenFootballStandings(slug) {
  const matches = await getOpenFootballMatches({ slugs: [slug] });
  return buildOpenFootballStandings(matches);
}

export async function getOpenFootballLeagueData(slug) {
  const league = OPENFOOTBALL_LEAGUES[slug];
  if (!league) return null;

  const matches = await getOpenFootballMatches({
    slugs: [slug],
  });

  return {
    ...league,
    matches,
    table: buildOpenFootballStandings(matches),
    updatedAt: new Date().toISOString(),
  };
}
