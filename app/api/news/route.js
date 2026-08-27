export async function GET() {
  try {
    const res = await fetch("https://saurav.tech");
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "فشل سحب الأخبار" }, { status: 500 });
  }
}
