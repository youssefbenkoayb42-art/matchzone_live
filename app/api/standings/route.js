import { NextResponse } from "next/server";

const LEAGUES = {
  "4328": "Premier League",
  "4335": "LaLiga",
  "4332": "Serie A",
  "4331": "Bundesliga",
  "4334": "Ligue 1",
};

export const revalidate = 300;

export async function GET(request) {
  const leagueId = new URL(request.url).searchParams.get("league");

  if (!leagueId || !LEAGUES[leagueId]) {
    return NextResponse.json(
      { error: "دوري غير مدعوم", availableLeagues: LEAGUES },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/lookuptable.php?l=${leagueId}`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "تعذر جلب جدول الترتيب" }, { status: 502 });
    }

    const data = await response.json();
    const table = Array.isArray(data?.table) ? data.table : [];

    return NextResponse.json(
      { league: LEAGUES[leagueId], leagueId, table },
      {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الترتيب" }, { status: 500 });
  }
}
