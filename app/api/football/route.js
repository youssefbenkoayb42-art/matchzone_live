export async function GET() {
  try {
    const response = await fetch(
      "https://footballdata.io/api/v1/fixtures/today",
      {
        headers: {
          Authorization: `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    console.log("FootballData API:", data);

    return Response.json(data);
  } catch (error) {
    console.error("FootballData API Error:", error);

    return Response.json(
      {
        results: 0,
        response: [],
        error: "حدث خطأ في جلب المباريات",
      },
      { status: 500 }
    );
  }
}
