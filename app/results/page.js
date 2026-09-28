import Link from "next/link";
import { getMatchSnapshot } from "../../lib/match-snapshot";

export const revalidate = 900;

export const metadata = {
  title: "المباريات المنتهية والنتائج",
  description:
    "نتائج مباريات كرة القدم المنتهية وآخر النتائج على MatchZone.",
  alternates: { canonical: "/results" },
};

function isFinished(match) {
  return ["FT", "AET", "PEN", "FINISHED"].includes(
    String(match?.fixture?.status?.short || "").toUpperCase()
  );
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

function MatchCard({ match }) {
  const id = encodeURIComponent(String(match.fixture.id));
  const home = match.teams?.home;
  const away = match.teams?.away;

  return (
    <article style={{
      background: "linear-gradient(145deg,#10251c,#0b1713)",
      border: "1px solid #284238",
      borderRadius: 20,
      padding: 18
    }}>
      <div style={{ color: "#82968d", fontSize: 12, marginBottom: 14, textAlign: "center" }}>
        {match.league?.name || "بطولة كرة القدم"} · {formatDate(match.fixture?.date)}
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)",
        alignItems: "center",
        gap: 12,
        textAlign: "center",
        direction: "ltr"
      }}>
        <div style={{ direction: "rtl" }}>
          <div style={{ minHeight: 56, display: "grid", placeItems: "center" }}>
            {home?.logo ? <img src={home.logo} alt="" width="52" height="52" style={{ width: 52, height: 52, objectFit: "contain" }} /> : null}
          </div>
          <strong style={{ display: "block", overflowWrap: "anywhere" }}>{home?.name || "الفريق المضيف"}</strong>
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>
            {match.goals?.home ?? "-"} - {match.goals?.away ?? "-"}
          </div>
          <div style={{ color: "#37e28a", fontSize: 11, fontWeight: 800 }}>انتهت</div>
        </div>
        <div style={{ direction: "rtl" }}>
          <div style={{ minHeight: 56, display: "grid", placeItems: "center" }}>
            {away?.logo ? <img src={away.logo} alt="" width="52" height="52" style={{ width: 52, height: 52, objectFit: "contain" }} /> : null}
          </div>
          <strong style={{ display: "block", overflowWrap: "anywhere" }}>{away?.name || "الفريق الضيف"}</strong>
        </div>
      </div>
      <Link href={"/matches/" + id} style={{
        display: "block",
        marginTop: 14,
        textAlign: "center",
        padding: "10px 12px",
        borderRadius: 12,
        background: "#07100d",
        border: "1px solid #284238",
        color: "#f4f8f6",
        textDecoration: "none",
        fontWeight: 800
      }}>
        تفاصيل المباراة
      </Link>
    </article>
  );
}

export default async function ResultsPage() {
  const matches = await getMatchSnapshot();
  const results = matches
    .filter(isFinished)
    .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date))
    .slice(0, 300);

  return (
    <main style={{ minHeight: "100vh", padding: "32px 16px 60px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{
          marginBottom: 26,
          padding: "24px 20px",
          borderRadius: 24,
          background: "linear-gradient(145deg,#10251c,#0b1713)",
          border: "1px solid #284238"
        }}>
          <p style={{ color: "#37e28a", margin: "0 0 8px", fontWeight: 900 }}>
            MATCHZONE RESULTS
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(28px,6vw,44px)" }}>
            المباريات المنتهية
          </h1>
          <p style={{ color: "#82968d", margin: "10px 0 0", lineHeight: 1.8 }}>
            آخر النتائج النهائية من مصادر MatchZone المجانية مع الحفاظ على هوية الفرق بمعرفات المزود.
          </p>
        </header>

        {results.length === 0 ? (
          <section style={{
            padding: 28,
            borderRadius: 20,
            border: "1px solid #284238",
            background: "#0b1713",
            textAlign: "center",
            color: "#82968d"
          }}>
            لا توجد نتائج منتهية في آخر لقطة بيانات.
          </section>
        ) : (
          <section style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 14
          }}>
            {results.map((match) => (
              <MatchCard key={match.fixture.id} match={match} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
