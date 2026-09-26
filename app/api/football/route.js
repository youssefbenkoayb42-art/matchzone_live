import { getOpenFootballMatches } from "@/lib/openfootball";

export const dynamic = "force-dynamic";

const SPORTSDB_KEY = "123";

const LEAGUES = [
  {
    id: "4328",
    name: "Premier League",
  },
  {
    id: "4335",
    name: "La Liga",
  },
  {
    id: "4332",
    name: "Serie A",
  },
  {
    id: "4331",
    name: "Bundesliga",
  },
  {
    id: "4334",
    name: "Ligue 1",
  },
];

function getArabicLeague(name) {
  const map = {
    "Premier League": "الدوري الإنجليزي",
    "La Liga": "الدوري الإسباني",
    "Serie A": "الدوري الإيطالي",
    Bundesliga: "الدوري الألماني",
    "Ligue 1": "الدوري الفرنسي",
    "American USL Championship":
      "الدوري الأمريكي USL",
    "Argentinian Primera Division":
      "الدوري الأرجنتيني",
  };

  return map[name] || name;
}


function getCompetitionType(name) {
  const value = String(name || "").toLowerCase();

  const internationalClubPatterns = [
    "champions league",
    "uefa champions",
    "europa league",
    "conference league",
    "club world cup",
    "intercontinental",
    "copa libertadores",
    "copa sudamericana",
    "concacaf champions",
    "afc champions",
    "caf champions",
    "afc cup",
    "caf confederation",
    "recopa sudamericana",
    "uefa super cup",
    "international club",
  ];

  const internationalTeamPatterns = [
    "world cup",
    "world championship",
    "euro",
    "nations league",
    "copa america",
    "afcon",
    "african cup",
    "asian cup",
    "concacaf gold cup",
    "gold cup",
    "copa oro",
    "world cup qualifier",
    "qualifying",
    "qualification",
    "international friendlies",
    "international friendly",
    "friendly international",
  ];

  if (internationalClubPatterns.some((pattern) => value.includes(pattern))) {
    return "international-club";
  }

  if (internationalTeamPatterns.some((pattern) => value.includes(pattern))) {
    return "international-team";
  }

  return "domestic";
}

function formatSportsDBEvent(event) {
  const date =
    event.strTimestamp ||
    `${event.dateEvent}T${event.strTime || "00:00:00"}`;

  let status = "NS";

  if (
    event.strStatus === "Match Finished" ||
    event.strStatus === "FT" ||
    event.intHomeScore !== null &&
    event.intAwayScore !== null &&
    new Date(date) < new Date()
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
      status: {
        short: status,
      },
    },

    teams: {
      home: {
        id: event.idHomeTeam
          ? Number(event.idHomeTeam)
          : null,
        name: event.strHomeTeam,
        logo: event.strHomeTeamBadge || null,
      },

      away: {
        id: event.idAwayTeam
          ? Number(event.idAwayTeam)
          : null,
        name: event.strAwayTeam,
        logo: event.strAwayTeamBadge || null,
      },
    },

    goals: {
      home:
        event.intHomeScore !== null &&
        event.intHomeScore !== undefined
          ? Number(event.intHomeScore)
          : null,

      away:
        event.intAwayScore !== null &&
        event.intAwayScore !== undefined
          ? Number(event.intAwayScore)
          : null,
    },

    league: {
      id: Number(event.idLeague),
      name: event.strLeague,
      logo: event.strLeagueBadge || null,
    },

    source: "TheSportsDB",
    competitionType: getCompetitionType(event.strLeague),
    eventId: Number(event.idEvent),
  };
}

function formatFootballDataMatch(match) {
  let status = "NS";

  if (
    match.status === "FINISHED" ||
    match.status === "AWARDED"
  ) {
    status = "FT";
  }

  if (
    match.status === "LIVE" ||
    match.status === "IN_PLAY" ||
    match.status === "PAUSED"
  ) {
    status = "LIVE";
  }

  return {
    fixture: {
      id: Number(match.id),
      date: match.utcDate,
      status: {
        short: status,
      },
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
      home:
        match.score?.fullTime?.home ??
        match.score?.regularTime?.home ??
        null,

      away:
        match.score?.fullTime?.away ??
        match.score?.regularTime?.away ??
        null,
    },

    league: {
      id: match.competition?.id || null,
      name: match.competition?.name || "Football",
      logo: match.competition?.emblem || null,
    },

    source: "football-data.org",
    competitionType: getCompetitionType(match.competition?.name),

    /*
      نحتفظ بمعرف المصدر الأصلي.
      سنستخدمه لاحقًا إذا أردنا بناء
      صفحة تفاصيل موحدة لكل المصادر.
    */
    externalId: Number(match.id),
  };
}

async function fetchSportsDB(date) {
  /*
    نجلب مباريات كرة القدم من اليوم وحتى الأيام القادمة.
    استخدام eventsday مع s=Soccer يجعل المصدر يعيد
    البطولات المتاحة في ذلك اليوم، بدل حصر الموقع
    في خمس دوريات فقط.
  */
  const days = Array.from({ length: 7 }, (_, index) => {
    const target = new Date(date + "T12:00:00Z");
    target.setUTCDate(target.getUTCDate() + index);
    return target.toISOString().slice(0, 10);
  });

  const requests = days.map(async (targetDate) => {
    try {
      const url =
        "https://www.thesportsdb.com/api/v1/json/" + SPORTSDB_KEY +
        "/eventsday.php?d=" + targetDate + "&s=Soccer";

      const response = await fetch(url, {
        next: {
          revalidate: 120,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return (data.events || []).map(
        formatSportsDBEvent
      );
    } catch (error) {
      console.error(
        "TheSportsDB " + targetDate + ":",
        error
      );

      return [];
    }
  });

  const results = await Promise.all(requests);

  return results.flat();
}

async function fetchOpenFootball(date) {
  const from = new Date(date + "T00:00:00Z");
  from.setUTCDate(from.getUTCDate() - 3);

  const to = new Date(date + "T00:00:00Z");
  to.setUTCDate(to.getUTCDate() + 7);

  try {
    return await getOpenFootballMatches({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });
  } catch (error) {
    console.error("OpenFootball error:", error);
    return [];
  }
}

async function fetchFootballData(date) {
  const token =
    process.env.FOOTBALL_DATA_API_KEY;

  if (!token) {
    console.warn(
      "FOOTBALL_DATA_API_KEY غير موجود"
    );

    return [];
  }

  try {
    const url =
      `https://api.football-data.org/v4/matches` +
      `?dateFrom=${date}&dateTo=${date}`;

    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": token,
      },

      next: {
        revalidate: 120,
      },
    });

    if (!response.ok) {
      const text = await response.text();

      console.error(
        "football-data.org:",
        response.status,
        text
      );

      return [];
    }

    const data = await response.json();

    return (data.matches || []).map(
      formatFootballDataMatch
    );
  } catch (error) {
    console.error(
      "football-data.org error:",
      error
    );

    return [];
  }
}

function removeDuplicates(matches) {
  const seen = new Set();

  return matches.filter((match) => {
    const home =
      match.teams?.home?.name
        ?.toLowerCase()
        .trim();

    const away =
      match.teams?.away?.name
        ?.toLowerCase()
        .trim();

    const date =
      match.fixture?.date?.slice(0, 10);

    const key =
      `${date}-${home}-${away}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

function sortMatches(matches) {
  return matches.sort((a, b) => {
    const dateA = new Date(
      a.fixture.date
    ).getTime();

    const dateB = new Date(
      b.fixture.date
    ).getTime();

    return dateA - dateB;
  });
}

export async function GET() {
  try {
    const now = new Date();

    const date =
      now.toISOString().slice(0, 10);

    const [
      sportsDBMatches,
      footballDataMatches,
      openFootballMatches,
    ] = await Promise.all([
      fetchSportsDB(date),
      fetchFootballData(date),
      fetchOpenFootball(date),
    ]);

    const allMatches = [
      ...sportsDBMatches,
      ...footballDataMatches,
      ...openFootballMatches,
    ];

    const uniqueMatches =
      removeDuplicates(allMatches);

    const sortedMatches =
      sortMatches(uniqueMatches);

    const formattedMatches =
      sortedMatches.map((match) => ({
        ...match,

        league: {
          ...match.league,

          name:
            match.league?.name ||
            "Football",
        },

        arabicLeague:
          getArabicLeague(
            match.league?.name ||
              "Football"
          ),
      }));

    return Response.json(
      {
        response: formattedMatches,

        results:
          formattedMatches.length,

        sources: {
          TheSportsDB:
            sportsDBMatches.length,

          "football-data.org":
            footballDataMatches.length,

          "openfootball/football.json":
            openFootballMatches.length,
        },

        updatedAt:
          new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error(
      "Football aggregator error:",
      error
    );

    return Response.json(
      {
        response: [],
        results: 0,
        error:
          "تعذر جلب بيانات المباريات",
        details: error.message,
      },
      {
        status: 500,
      }
    );
  }
    }
