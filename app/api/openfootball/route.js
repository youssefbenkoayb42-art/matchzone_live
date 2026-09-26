import { NextResponse } from "next/server";
import {
  OPENFOOTBALL_LEAGUES,
  getOpenFootballLeagueData,
  getOpenFootballMatches,
} from "../../../lib/openfootball";

export const revalidate = 86400;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league");
  const mode = searchParams.get("mode") || "window";

  if (league && !OPENFOOTBALL_LEAGUES[league]) {
    return NextResponse.json(
      {
        error: "بطولة OpenFootball غير مدعومة",
        availableLeagues: Object.keys(OPENFOOTBALL_LEAGUES),
      },
      { status: 400 }
    );
  }

  try {
    if (league && mode === "season") {
      const data = await getOpenFootballLeagueData(league);

      return NextResponse.json(
        {
          source: "openfootball/football.json",
          season: "2026-27",
          ...data,
        },
        {
          headers: {
            "Cache-Control":
              "s-maxage=86400, stale-while-revalidate=172800",
          },
        }
      );
    }

    const now = new Date();
    const from = new Date(now);
    from.setUTCDate(from.getUTCDate() - 3);

    const to = new Date(now);
    to.setUTCDate(to.getUTCDate() + 7);

    const matches = await getOpenFootballMatches({
      slugs: league ? [league] : Object.keys(OPENFOOTBALL_LEAGUES),
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });

    return NextResponse.json(
      {
        source: "openfootball/football.json",
        season: "2026-27",
        response: matches,
        results: matches.length,
        leagues: Object.values(OPENFOOTBALL_LEAGUES).map((item) => ({
          slug: item.slug,
          name: item.name,
          arabicName: item.arabicName,
          code: item.code,
        })),
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "s-maxage=86400, stale-while-revalidate=172800",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        source: "openfootball/football.json",
        response: [],
        results: 0,
        error: "تعذر جلب بيانات OpenFootball",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
