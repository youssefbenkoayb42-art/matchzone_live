export async function GET() {
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

  return Response.json({
    apiStatus: response.status,
    matchesFound: data.matches?.length ?? 0,
    apiError: data.errorCode ?? null,
    message: data.message ?? null,
  });
}
