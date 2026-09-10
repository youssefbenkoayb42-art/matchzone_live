export const dynamic = "force-dynamic";

function getStatus(status) {
  const value = String(status || "").toLowerCase();

  if (
    value.includes("finished") ||
    value.includes("complete") ||
    value === "ft"
  ) {
    return "FT";
  }

  if (
    value.includes("not started") ||
    value.includes("scheduled") ||
    value === "ns"
  ) {
    return "NS";
  }

  return "LIVE";
}

function getArabicLeague(league) {
  const map = {
    "Premier League": "الدوري الإنجليزي",
    "La Liga": "الدوري الإسباني",
    "Serie A": "الدوري الإيطالي",
    Bundesliga: "الدوري الألماني",
    "Ligue 1": "الدوري الفرنسي",
  };

  return map[league] || league;
}

function convertTheSportsDB(events = []) {
  return events
    .filter((event) => event.strHomeTeam && event.strAwayTeam)
    .map((event) => ({
      fixture: {
        id: event.idEvent,
        date: event.strTimestamp || `${event.dateEvent}T${event.strTime || "00:00:00"}`,
        status: {
          short: getStatus(event.strStatus),
        },
      },

      teams: {
        home: {
          name: event.strHomeTeam,
          logo: event.strHomeTeamBadge || null,
        },
        away: {
          name: event.strAwayTeam,
          logo: event.strAwayTeamBadge || null,
        },
      },

      goals: {
        home:
          event.intHomeScore !== null && event.intHomeScore !== undefined
            ? Number(event.intHomeScore)
            : null,
        away:
          event.intAwayScore !== null && event.intAwayScore !== undefined
            ? Number(event.intAwayScore)
            : null,
      },

      league: {
        id: event.idLeague,
        name: event.strLeague,
        logo: event.strLeagueBadge || null,
      },
    }));
}

function convertFootballData(matches = []) {
  return matches
    .filter((match) => match.homeTeam && match.awayTeam)
    .map((match) => ({
      fixture: {
        id: match.id,
        date: match.utcDate,
        status: {
          short: getStatus(match.status),
        },
      },

      teams: {
        home: {
          name: match.homeTeam.name,
          logo: match.homeTeam.crest || null,
        },
        away: {
          name: match.awayTeam.name,
          logo: match.awayTeam.crest || null,
        },
      },

      goals: {
        home:
          match.score?.fullTime?.home !== null &&
          match.score?.fullTime?.home !== undefined
            ? match.score.fullTime.home
            : null,

        away:
          match.score?.fullTime?.away !== null &&
          match.score?.fullTime?.away !== undefined
            ? match.score.fullTime.away
            : null,
      },

      league: {
        id: match.competition?.id,
        name: match.competition?.name || "Football",
        logo: match.competition?.emblem || null,
      },
    }));
}

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  // =====================================================
  // المصدر الأول: TheSportsDB
  // =====================================================

  try {
    const sportsDBUrl =
      `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${today}&s=Soccer`;

    const res = await fetch(sportsDBUrl, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();

      const matches = convertTheSportsDB(data.events || []);

      if (matches.length > 0) {
        console.log(
          `TheSportsDB: تم جلب ${matches.length} مباراة`
        );

        return Response.json({
          response: matches,
          source: "TheSportsDB",
        });
      }
    }

    console.log("TheSportsDB لم يرجع مباريات اليوم");
  } catch (error) {
    console.error("خطأ TheSportsDB:", error.message);
  }

  // =====================================================
  // المصدر الاحتياطي: football-data.org
  // =====================================================

  const footballDataKey = process.env.FOOTBALL_DATA_API_KEY;

  if (footballDataKey) {
    try {
      const footballDataUrl =
        `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${today}`;

      const res = await fetch(footballDataUrl, {
        headers: {
          "X-Auth-Token": footballDataKey,
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();

        const matches = convertFootballData(data.matches || []);

        if (matches.length > 0) {
          console.log(
            `football-data.org: تم جلب ${matches.length} مباراة`
          );

          return Response.json({
            response: matches,
            source: "football-data.org",
          });
        }
      } else {
        console.error(
          "football-data.org status:",
          res.status
        );
      }
    } catch (error) {
      console.error(
        "خطأ football-data.org:",
        error.message
      );
    }
  } else {
    console.error(
      "FOOTBALL_DATA_API_KEY غير موجود في Environment Variables"
    );
  }

  // =====================================================
  // لم ينجح أي مصدر
  // =====================================================

  return Response.json(
    {
      response: [],
      error: "لم يتم العثور على مباريات من مصادر البيانات الحالية",
    },
    { status: 200 }
  );
    }
