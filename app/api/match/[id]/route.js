import { getMatchSnapshot } from "../../../../lib/match-snapshot";

function longStatus(short) {
  const value = String(short || "NS").toUpperCase();
  if (value === "LIVE") return "Match Live";
  if (value === "NS") return "Not Started";
  if (value === "POSTPONED") return "Postponed";
  if (value === "AET") return "After Extra Time";
  if (value === "PEN") return "After Penalties";
  return "Match Finished";
}

export async function GET(request, { params }) {
  const { id } = await params;
  const matches = await getMatchSnapshot();
  const match = matches.find(
    (item) => String(item?.fixture?.id) === String(id)
  );

  if (!match) {
    return Response.json(
      { response: [], errors: { message: "لم يتم العثور على المباراة" } },
      { status: 404 }
    );
  }

  return Response.json({
    response: [
      {
        ...match,
        fixture: {
          ...match.fixture,
          status: {
            ...(match.fixture?.status || {}),
            long: longStatus(match.fixture?.status?.short),
          },
        },
        events: match.details?.events || [],
        stats: match.details?.statistics || [],
        lineup: [],
        timeline: match.details?.events || [],
        video: null,
        eventId: match.externalId || match.fixture?.id,
        details: match.details || {
          events: [],
          statistics: [],
          updatedAt: null,
        },
      },
    ],
  });
}
