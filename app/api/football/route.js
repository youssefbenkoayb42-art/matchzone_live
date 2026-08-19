export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${today}&s=Soccer`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    const formattedMatches = (data.events || []).map((event) => ({
      time: event.strTime || "",
      
      home: event.strHomeTeam || "",
      homeLogo: event.strHomeTeamBadge || "",

      away: event.strAwayTeam || "",
      awayLogo: event.strAwayTeamBadge || "",

      status:
        event.strStatus === "Match Finished"
          ? "FT"
          : event.strStatus === "1H" ||
            event.strStatus === "2H" ||
            event.strStatus === "LIVE"
          ? "LIVE"
          : "NS",

      homeScore: event.intHomeScore
        ? Number(event.intHomeScore)
        : null,

      awayScore: event.intAwayScore
        ? Number(event.intAwayScore)
        : null,

      league: event.strLeague || "كرة القدم",
    }));

    return Response.json({
      results: formattedMatches.length,
      response: formattedMatches,
    });
  } catch (error) {
    console.error("TheSportsDB Error:", error);

    return Response.json({
      results: 0,
      response: [],
      error: "حدث خطأ في جلب المباريات",
    });
  }
      }
