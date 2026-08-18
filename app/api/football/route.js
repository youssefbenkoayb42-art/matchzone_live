
export async function GET() {
  const response = await fetch(
    "https://v3.football.api-sports.io/fixtures?date=2026-08-18",
    {
      headers: {
        "x-apisports-key": process.env.API_FOOTBALL_KEY,
      },
    }
  );

  const data = await response.json();

  return Response.json(data);
}
