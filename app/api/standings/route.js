import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import pathNode from "node:path";

export const dynamic = "force-dynamic";

const LEGACY = {
  "4328": "eng.1",
  "4335": "esp.1",
  "4332": "ita.1",
  "4331": "ger.1",
  "4334": "fra.1",
};

export async function GET(request) {
  try {
    const leagueParam = new URL(request.url).searchParams.get("league");
    const raw = await fs.readFile(
      pathNode.join(process.cwd(), "data", "scraped-matches.json"),
      "utf8"
    );
    const data = JSON.parse(raw);
    const code = LEGACY[leagueParam] || String(leagueParam || "").replace(/^espn:/, "");

    if (!code || !data?.standings?.[code]) {
      return NextResponse.json(
        { error: "الترتيب غير متاح في اللقطة الحالية", availableLeagues: Object.keys(data?.standings || {}) },
        { status: 404 }
      );
    }

    return NextResponse.json({
      league: data.standings[code].leagueName || code,
      leagueCode: code,
      season: data.standings[code].season || null,
      groups: data.standings[code].groups || [],
      updatedAt: data.standings[code].updatedAt || data.updatedAt || null,
    }, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json({ error: "تعذر قراءة جدول الترتيب" }, { status: 500 });
  }
}
