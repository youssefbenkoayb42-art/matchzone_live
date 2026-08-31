export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GNEWS_API_KEY غير موجود في Vercel" },
        { status: 500 }
      );
    }

    const url =
      `https://gnews.io/api/v4/search` +
      `?q=football` +
      `&lang=ar` +
      `&max=10` +
      `&sortby=publishedAt` +
      `&apikey=${apiKey}`;

    const res = await fetch(url, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const errorText = await res.text();

      console.error("GNews Error:", errorText);

      return Response.json(
        {
          error: "GNews رفض الطلب",
          status: res.status,
          details: errorText,
        },
        { status: res.status }
      );
    }

    const data = await res.json();

    return Response.json({
      articles: data.articles || [],
      totalArticles: data.totalArticles || 0,
    });
  } catch (error) {
    console.error("News API Error:", error);

    return Response.json(
      {
        error: "فشل سحب الأخبار",
        details: error.message,
      },
      { status: 500 }
    );
  }
      }
