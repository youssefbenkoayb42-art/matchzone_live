import { getMatchSnapshot, getMatchSnapshotStatus } from "../../../lib/match-snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [matches, snapshot] = await Promise.all([
      getMatchSnapshot(),
      getMatchSnapshotStatus(),
    ]);

    return Response.json(
      {
        response: matches,
        results: matches.length,
        source: snapshot.source || "football-data.org + ESPN supplemental",
        logoPolicy: "strict provider team ID; unknown or collision => UI Avatars",
        updatedAt: snapshot.updatedAt || null,
        serverUpdatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Football snapshot error:", error);
    return Response.json(
      {
        response: [],
        results: 0,
        source: "football-data.org + ESPN supplemental",
        error: "تعذر تحميل بيانات المباريات",
      },
      { status: 503 }
    );
  }
}
