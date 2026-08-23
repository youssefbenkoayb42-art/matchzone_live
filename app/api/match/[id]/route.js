export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/lookupevent.php?id=${id}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return Response.json(
        {
          response: [],
          errors: {
            message: "فشل الاتصال بـ TheSportsDB",
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    const event = data.events?.[0];

    if (!event) {
      return Response.json({
        response: [],
        errors: {
          message: "لم يتم العثور على المباراة",
        },
      });
    }

    const match = {
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
          event.intHomeScore !== null
            ? Number(event.intHomeScore)
            : null,
        away:
          event.intAwayScore !== null
            ? Number(event.intAwayScore)
            : null,
      },

      video: event.strVideo || null,

      eventId: event.idEvent,
    };

    return Response.json({
      response: [match],
    });
  } catch (error) {
    console.error("TheSportsDB Match Error:", error);

    return Response.json(
      {
        response: [],
        errors: {
          message: "حدث خطأ في جلب المباراة",
        },
      },
      { status: 500 }
    );
  }
          }
