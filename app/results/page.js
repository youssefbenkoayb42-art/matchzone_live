import Link from "next/link";
import { getFallbackMatches } from "../../lib/fallback-matches";

export const revalidate = 900;

export const metadata = {
  title: "المباريات المنتهية والنتائج",
  description:
    "نتائج مباريات كرة القدم المنتهية اليوم وآخر النتائج مع النتائج والبطولات والفرق على MatchZone.",
  alternates: { canonical: "/results" },
  openGraph: {
    title: "المباريات المنتهية والنتائج | MatchZone",
    description: "تابع آخر نتائج مباريات كرة القدم والنتائج النهائية حسب البطولة.",
    url: "/results",
    type: "website",
  },
};

function isFinished(match) {
  const status = String(match?.fixture?.status?.short || "").toUpperCase();
  return ["FT", "AET", "PEN", "FINISHED"].includes(status);
}

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString("ar-MA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "تاريخ المباراة";
  }
}

function formatTime(date) {
  try {
    return new Date(date).toLocaleTimeString("ar-MA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

function MatchCard({ match }) {
  const id = encodeURIComponent(String(match.fixture.id));
  const home = match.teams?.home;
  const away = match.teams?.away;

  return (
    <article
      style={{
        background: "linear-gradient(145deg,#10251c,#0b1713)",
        border: "1px solid #284238",
        borderRadius: "20px",
        padding: "18px",
      }}
    >
      <div style={{ color: "#82968d", fontSize: 12, marginBottom: 14, textAlign: "center" }}>
        {match.league?.name || "بطولة كرة القدم"} · {formatDate(match.fixture?.date)}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 12,
          textAlign: "center",
        }}
      >
        <strong>{home?.name || "الفريق المضيف"}</strong>
        <div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>
            {match.goals?.home ?? "-"} - {match.goals?.away ?? "-"}
          </div>
          <div style={{ color: "#37e28a", fontSize: 11, fontWeight: 800 }}>انتهت</div>
        </div>
        <strong>{away?.name || "الفريق الضيف"}</strong>
      </div>

      <div style={{ color: "#82968d", fontSize: 12, textAlign: "center", marginTop: 12 }}>
        {formatTime(match.fixture?.date)}
      </div>

      <Link
        href={`/matches/${id}`}
        style={{
          display: "block",
          marginTop: 14,
          textAlign: "center",
          padding: "10px 12px",
          borderRadius: 12,
          background: "#07100d",
          border: "1px solid #284238",
          color: "#f4f8f6",
          textDecoration: "none",
          fontWeight: 800,
        }}
      >
        تفاصيل المباراة
      </Link>
    </article>
  );
}

export default async function ResultsPage() {
  const all = await getFallbackMatches();
  const results = all
    .filter(isFinished)
    .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date))
    .slice(0, 300);

  const itemList = results.slice(0, 50).map((match, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `https://matchzone-live.vercel.app/matches/${encodeURIComponent(String(match.fixture.id))}`,
    name: `${match.teams?.home?.name || ""} ${match.goals?.home ?? "-"}-${match.goals?.away ?? "-"} ${match.teams?.away?.name || ""}`,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "المباريات المنتهية والنتائج",
    description: "نتائج مباريات كرة القدم المنتهية على MatchZone.",
    url: "https://matchzone-live.vercel.app/results",
    isPartOf: {
      "@type": "WebSite",
      name: "MatchZone",
      url: "https://matchzone-live.vercel.app",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: itemList,
    },
  };

  return (
    <main style={{ minHeight: "100vh", padding: "32px 16px 60px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header
          style={{
            marginBottom: 26,
            padding: "24px 20px",
            borderRadius: 24,
            background: "linear-gradient(145deg,#10251c,#0b1713)",
            border: "1px solid #284238",
          }}
        >
          <p style={{ color: "#37e28a", margin: "0 0 8px", fontWeight: 900 }}>MATCHZONE RESULTS</p>
          <h1 style={{ margin: 0, fontSize: "clamp(28px,6vw,44px)" }}>المباريات المنتهية</h1>
          <p style={{ color: "#82968d", margin: "10px 0 0", lineHeight: 1.8 }}>
            آخر النتائج النهائية لمباريات كرة القدم، مع البطولة والتاريخ ورابط تفاصيل كل مباراة.
          </p>
        </header>

        {results.length === 0 ? (
          <section
            style={{
              padding: 28,
              borderRadius: 20,
              border: "1px solid #284238",
              background: "#0b1713",
              textAlign: "center",
              color: "#82968d",
            }}
          >
            لا توجد نتائج منتهية محفوظة حاليًا. سيتم تحديث قاعدة البيانات الاحتياطية تلقائيًا.
          </section>
        ) : (
          <section
            aria-label="نتائج المباريات"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 14,
            }}
          >
            {results.map((match) => (
              <MatchCard key={match.fixture.id} match={match} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
