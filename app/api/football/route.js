const LEAGUES = [
  { id: 4328, name: "Premier League" },
  { id: 4335, name: "La Liga" },
  { id: 4332, name: "Serie A" },
  { id: 4331, name: "Bundesliga" },
  { id: 4334, name: "Ligue 1" },
];

function formatMatch(event) {
  return {
    fixture: {
      id: Number(event.idEvent),
      date:
        event.strTimestamp ||
        `${event.dateEvent}T${event.strTime || "00:00:00"}`,
      status: {
        short: event.strStatus || "NS",
        long:
          event.strStatus === "FT"
            ? "Match Finished"
            : event.strStatus || "Not Started",
      },
      venue: {
        name: event.strVenue || null,
      },
    },

    league: {
      id: Number(event.idLeague),
      name: event.strLeague || "Unknown League",
      season: event.strSeason || null,
      logo: event.strLeagueBadge || null,
    },

    teams: {
      home: {
        id: Number(event.idHomeTeam),
        name: event.strHomeTeam,
        logo: event.strHomeTeamBadge || null,
      },
      away: {
        id: Number(event.idAwayTeam),
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

    video: event.strVideo || null,

    eventId: event.idEvent,
  };
}

export async function GET() {
  try {
    const season = "2026-2027";

    const requests = LEAGUES.map(async (league) => {
      const response = await fetch(
        `https://www.thesportsdb.com/api/v1/json/123/eventsround.php?id=${league.id}&r=1&s=${season}`,
        {
          next: {
            revalidate: 300,
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return data.events || [];
    });

    const results = await Promise.all(requests);

    const allEvents = results.flat();

    // إزالة المباريات المكررة
    const uniqueEvents = Array.from(
      new Map(
        allEvents.map((event) => [event.idEvent, event])
      ).values()
    );

    // ترتيب المباريات حسب التاريخ والوقت
    uniqueEvents.sort((a, b) => {
      const dateA = new Date(
        a.strTimestamp ||
          `${a.dateEvent}T${a.strTime || "00:00:00"}`
      );

      const dateB = new Date(
        b.strTimestamp ||
          `${b.dateEvent}T${b.strTime || "00:00:00"}`
      );

      return dateA - dateB;
    });

    const matches = uniqueEvents.map(formatMatch);

    return Response.json({
      response: matches,
      total: matches.length,
    });
  } catch (error) {
    console.error("TheSportsDB Error:", error);

    return Response.json(
      {
        response: [],
        total: 0,
        error: "Failed to fetch matches",
      },
      { status: 500 }
    );
  }
            }
