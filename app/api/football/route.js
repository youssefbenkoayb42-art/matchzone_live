export const dynamic = "force-dynamic";

const SPORTSDB_KEY = "123";

const LEAGUES = [
  { id: "4328", name: "Premier League" },
  { id: "4335", name: "La Liga" },
  { id: "4332", name: "Serie A" },
  { id: "4331", name: "Bundesliga" },
  { id: "4334", name: "Ligue 1" },
];

function getArabicLeague(name) {
  if (!name) return "كرة القدم";
  
  const map = {
    "Premier League": "الدوري الإنجليزي الممتاز",
    "English Premier League": "الدوري الإنجليزي الممتاز",
    "La Liga": "الدوري الإسباني",
    "LaLiga": "الدوري الإسباني",
    "Serie A": "الدوري الإيطالي A",
    "Italian Serie A": "الدوري الإيطالي الدرجة الأولى",
    "Bundesliga": "الدوري الألماني",
    "Ligue 1": "الدوري الفرنسي",
    "American USL Championship": "الدوري الأمريكي USL",
    "Argentinian Primera Division": "الدوري الأرجنتيني",
  };

  return map[name] || name;
}

function formatSportsDBEvent(event) {
  const date = event.strTimestamp || `${event.dateEvent}T${event.strTime || "00:00:00"}`;
  let status = "NS";

  if (
    event.strStatus === "Match Finished" ||
    event.strStatus === "FT" ||
    (event.intHomeScore !== null && event.intAwayScore !== null && new Date(date) < new Date())
  ) {
    status = "FT";
  }

  if (
    event.strProgress ||
    event.strStatus === "Live" ||
    event.strStatus === "1H" ||
    event.strStatus === "2H"
  ) {
    status = "LIVE";
  }

  return {
    fixture: {
      id: Number(event.idEvent),
      date,
      status: { short: status },
    },
    teams: {
      home: {
        id: event.idHomeTeam ? Number(event.idHomeTeam) : null,
        name: event.strHomeTeam,
        logo: event.strHomeTeamBadge || null,
      },
      away: {
        id: event.idAwayTeam ? Number(event.idAwayTeam) : null,
        name: event.strAwayTeam,
        logo: event.strAwayTeamBadge || null,
      },
    },
    goals: {
      home: event.intHomeScore !== null && event.intHomeScore !== undefined ? Number(event.intHomeScore) : null,
      away: event.intAwayScore !== null && event.intAwayScore !== undefined ? Number(event.intAwayScore) : null,
    },
    league: {
      id: Number(event.idLeague),
      name: event.strLeague,
      logo: event.strLeagueBadge || null,
    },
    source: "TheSportsDB",
    eventId: Number(event.idEvent),
  };
}

function formatFootballDataMatch(match) {
  let status = "NS";

  if (match.status === "FINISHED" || match.status === "AWARDED") {
    status = "FT";
  }

  if (match.status === "LIVE" || match.status === "IN_PLAY" || match.status === "PAUSED") {
    status = "LIVE";
  }

  return {
    fixture: {
      id: Number(match.id),
      date: match.utcDate,
      status: { short: status },
    },
    teams: {
      home: {
        id: match.homeTeam?.id || null,
        name: match.homeTeam?.name || "Unknown",
        logo: match.homeTeam?.crest || null,
      },
      away: {
        id: match.awayTeam?.id || null,
        name: match.awayTeam?.name || "Unknown",
        logo: match.awayTeam?.crest || null,
      },
    },
    goals: {
      home: match.score?.fullTime?.home ?? match.score?.regularTime?.home ?? null,
      away: match.score?.fullTime?.away ?? match.score?.regularTime?.away ?? null,
    },
    league: {
      id: match.competition?.id || null,
      name: match.competition?.name || "Football",
      logo: match.competition?.emblem || null,
    },
    source: "football-data.org",
    externalId: Number(match.id),
  };
}

async function fetchSportsDB(date) {
  const requests = LEAGUES.map(async (league) => {
    try {
      const url = `https://thesportsdb.com{SPORTSDB_KEY}/eventsday.php?d=${date}&l=${league.id}`;
      const response = await fetch(url, { next: { revalidate: 120 } });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.events || []).map(formatSportsDBEvent);
    } catch (error) {
      console.error(`TheSportsDB ${league.name}:`, error);
      return [];
    }
  });

  const generalRequest = (async () => {
    try {
      const url = `https://thesportsdb.com{SPORTSDB_KEY}/eventsday.php?d=${date}&s=Soccer`;
      const response = await fetch(url, { next: { revalidate: 120 } });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.events || []).map(formatSportsDBEvent);
    } catch (error) {
      console.error("TheSportsDB general:", error);
      return [];
    }
  })();

  const results = await Promise.all([...requests, generalRequest]);
  return results.flat();
}

async function fetchFootballData(date) {
  // استخدام الرمز الجديد المستخرج من الصورة بشكل مباشر في حال لم يتم إعداده في البيئة المحيطة .env
  const token = process.env.FOOTBALL_DATA_API_KEY || "21fcc124d0124fa1a42e2edc5ce9c06a";

  try {
    const url = `https://football-data.org{date}&dateTo=${date}`;
    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": token,
      },
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("football-data.org error status:", response.status, text);
      return [];
    }

    const data = await response.json();
    return (data.matches || []).map(formatFootballDataMatch);
  } catch (error) {
    console.error("football-data.org connection error:", error);
    return [];
  }
}

function removeDuplicates(matches) {
  const seen = new Set();
  return matches.filter((match) => {
    const home = match.teams?.home?.name?.toLowerCase().trim() || "";
    const away = match.teams?.away?.name?.toLowerCase().trim() || "";
    const date = match.fixture?.date?.slice(0, 10) || "";
    const key = `${date}-${home}-${away}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortMatches(matches) {
  return matches.sort((a, b) => {
    const dateA = new Date(a.fixture.date).getTime();
    const dateB = new Date(b.fixture.date).getTime();
    return dateA - dateB;
  });
}

export async function GET() {
  try {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);

    const [sportsDBMatches, footballDataMatches] = await Promise.all([
      fetchSportsDB(date),
      fetchFootballData(date),
    ]);

    const allMatches = [...sportsDBMatches, ...footballDataMatches];
    const uniqueMatches = removeDuplicates(allMatches);
    const sortedMatches = sortMatches(uniqueMatches);

    const formattedMatches = sortedMatches.map((match) => {
      const leagueName = match.league?.name || "Football";
      return {
        ...match,
        league: {
          ...match.league,
          name: leagueName,
        },
        arabicLeague: getArabicLeague(leagueName),
      };
    });

    return Response.json(
      {
        response: formattedMatches,
        results: formattedMatches.length,
        sources: {
          TheSportsDB: sportsDBMatches.length,
          "football-data.org": footballDataMatches.length,
        },
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Football aggregator error:", error);
    return Response.json(
      {
        response: [],
        results: 0,
        error: "تعذر جلب بيانات المباريات",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
