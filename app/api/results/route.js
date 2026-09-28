import { getMatchSnapshot, getMatchSnapshotStatus } from "../../../lib/match-snapshot";

export const dynamic = "force-dynamic";

function isFinished(match) {
  return ["FT", "AET", "PEN", "FINISHED"].includes(
    String(match?.fixture?.status?.short || "").toUpperCase()
  );
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
    const [matches, snapshot] = await Promise.all([
      getMatchSnapshot(),
      getMatchSnapshotStatus(),
    ]);

    const finished = sortNewestFirst(matches.filter(isFinished));

    return Response.json(
      {
        response: finished,
        results: finished.length,
        source: "football-data.org",
        snapshot,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=3600" } }
    );
  } catch (error) {
    console.error("Results API error:", error);
    return Response.json(
      { response: [], results: 0, error: "تعذر تحميل النتائج" },
      { status: 500 }
    );
  }
}
