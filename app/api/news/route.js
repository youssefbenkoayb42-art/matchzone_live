export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // الانتقال لمزود الأخبار العالمي المستقر لضمان تدفق المقالات فوراً
    const res = await fetch(
      "https://saurav.tech",
      { cache: "no-store" }
    );
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "فشل سحب الأخبار" }, { status: 500 });
  }
}
