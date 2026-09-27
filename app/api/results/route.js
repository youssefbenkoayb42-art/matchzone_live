import { getFallbackMatches } from "../../../lib/fallback-matches";

export const dynamic = "force-dynamic";

function isFinished(match) {
  const status = String(match?.fixture?.status?.short || "").toUpperCase();
  return ["FT", "AET", "PEN", "FINISHED"].includes(status);
}

function sortNewestFirst(matches) {
  return [...matches].sort(
    (a, b) =>
      new Date(b.fixture?.date || 0).getTime() -
      new Date(a.fixture?.date || 0).getTime()
  );
}

export async function GET() {
  try {
    const fallback = await getFallbackMatches();
    const finished = sortNewestFirst(
      fallback.filter(isFinished)
    );

    return Response.json(
      {
        response: finished,
        results: finished.length,
        source: "flashscore-feed-fallback",
        fallback: {
          updatedAt: new Date().toISOString(),
          count: finished.length,
        },
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Results API error:", error);
    return Response.json(
      { response: [], results: 0, error: "تعذر تحميل النتائج" },
      { status: 500 }
    );
  }
}
