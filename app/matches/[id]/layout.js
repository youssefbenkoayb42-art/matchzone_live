const BASE_URL = "https://matchzone-live.vercel.app";

async function getMatch(id) {
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/lookupevent.php?id=${encodeURIComponent(id)}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.events) ? data.events[0] : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const event = await getMatch(id);

  if (!event) {
    return {
      title: "تفاصيل المباراة",
      description: "تفاصيل ونتيجة مباراة كرة القدم ومعلومات الفريقين.",
    };
  }

  const home = event.strHomeTeam || "الفريق المضيف";
  const away = event.strAwayTeam || "الفريق الضيف";
  const league = event.strLeague || "كرة القدم";
  const title = `${home} ضد ${away} | نتيجة المباراة`;
  const description = `نتيجة مباراة ${home} ضد ${away} في ${league}. تابع النتيجة والتفاصيل وأبرز أحداث المباراة على MatchZone.`;
  const url = `${BASE_URL}/matches/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "MatchZone",
      locale: "ar_MA",
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default function MatchLayout({ children }) {
  return children;
}
