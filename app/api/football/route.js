export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${today}&s=Soccer`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      return Response.json(
        { response: [], error: "TheSportsDB request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    const matches = (data.events || []).map((event) => ({
      fixture: {
        id: Number(event.idEvent),
        date: event.strTimestamp || `${event.dateEvent}T${event.strTime || "00:00:00"}`,
        status: {
          short: event.strStatus || "NS",
          long: event.strStatus === "FT" ? "Match Finished" : event.strStatus || "Not Started",
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
        home: event.intHomeScore !== null
          ? Number(event.intHomeScore)
          : null,
        away: event.intAwayScore !== null
          ? Number(event.intAwayScore)
          : null,
      },

      video: event.strVideo || null,

      // TheSportsDB match ID
      eventId: event.idEvent,
    }));

    return Response.json({
      response: matches,
    });
  } catch (error) {
    console.error("TheSportsDB Error:", error);

    return Response.json(
      {
        response: [],
        error: "Failed to fetch matches",
      },
      { status: 500 }
    );
  }
        }
