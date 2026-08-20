export async function GET(request, { params }) {
  const { id } = params;

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${id}`,
      {
        headers: {
          "x-apisports-key": process.env.API_FOOTBALL_KEY,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        response: [],
        errors: {
          message: "حدث خطأ في جلب المباراة",
        },
      },
      { status: 500 }
    );
  }
      }
