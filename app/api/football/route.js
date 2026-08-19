export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const response = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${today}`,
      {
        headers: {
          "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: "Football API Error",
          details: data,
        },
        { status: response.status }
      );
    }

    const formattedMatches = (data.matches || []).map((item) => ({
      time: new Date(item.utcDate).toLocaleTimeString("ar-MA", {
        hour: "2-digit",
        minute: "2-digit",
      }),

      home: item.homeTeam.name,
      homeLogo: item.homeTeam.crest,

      away: item.awayTeam.name,
      awayLogo: item.awayTeam.crest,

      status:
        item.status === "FINISHED"
          ? "FT"
          : item.status === "IN_PLAY" ||
            item.status === "PAUSED"
          ? "LIVE"
          : "NS",

      homeScore: item.score?.fullTime?.home ?? null,
      awayScore: item.score?.fullTime?.away ?? null,

      league: item.competition.name,
    }));

    return Response.json({
      results: formattedMatches.length,
      response: formattedMatches,
    });
  } catch (error) {
    console.error("Football API Error:", error);

    return Response.json(
      {
        results: 0,
        response: [],
        error: "حدث خطأ في الاتصال بمصدر المباريات",
      },
      { status: 500 }
    );
  }
      }
