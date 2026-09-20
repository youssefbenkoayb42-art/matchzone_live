const BASE_URL = "https://matchzone-live.vercel.app";
const LEAGUES = [4328, 4335, 4332, 4331, 4334];

async function getTodayMatches() {
  const date = new Date().toISOString().slice(0, 10);

  try {
    const responses = await Promise.all(
      LEAGUES.map(async (leagueId) => {
        const res = await fetch(
          `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${date}&l=${leagueId}`,
          { next: { revalidate: 300 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data?.events) ? data.events : [];
      })
    );

    const unique = new Map();
    responses.flat().forEach((event) => {
      if (event?.idEvent) unique.set(event.idEvent, event);
    });

    return [...unique.values()].sort((a, b) =>
      String(a?.strTime || "").localeCompare(String(b?.strTime || ""))
    );
  } catch {
    return [];
  }
}

function statusLabel(event) {
  const status = String(event?.strStatus || "").toLowerCase();

  if (["match finished", "ft", "finished"].includes(status)) return "انتهت";
  if (["1h", "2h", "ht", "live", "in progress"].includes(status)) return "مباشر";
  return event?.strTime ? event.strTime.slice(0, 5) : "لم تبدأ";
}

export const metadata = {
  title: "مباريات اليوم",
  description:
    "مباريات اليوم ونتائج كرة القدم ومواعيد أهم المباريات في البطولات العالمية على MatchZone.",
  alternates: {
    canonical: `${BASE_URL}/matches/today`,
  },
};

export default async function TodayMatchesPage() {
  const matches = await getTodayMatches();

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#07100d",
        color: "#f4f8f6",
        padding: "30px 16px 60px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
        <a
          href="/"
          style={{
            color: "#37e28a",
            textDecoration: "none",
            fontWeight: "800",
          }}
        >
          ← العودة إلى MatchZone
        </a>

        <header style={{ margin: "30px 0" }}>
          <p style={{ color: "#37e28a", fontWeight: "800" }}>⚽ MatchZone</p>
          <h1 style={{ fontSize: "clamp(28px, 6vw, 44px)", margin: "8px 0" }}>
            مباريات اليوم ونتائج كرة القدم
          </h1>
          <p style={{ color: "#8fa099", lineHeight: "1.8" }}>
            جدول مباريات اليوم، المواعيد والنتائج وأبرز البطولات العالمية.
          </p>
        </header>

        {matches.length === 0 ? (
          <section
            style={{
              padding: "35px 20px",
              borderRadius: "20px",
              background: "#10251c",
              border: "1px solid #284238",
              textAlign: "center",
            }}
          >
            لا توجد مباريات متاحة حاليًا.
          </section>
        ) : (
          <section
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            {matches.map((match) => (
              <article
                key={match.idEvent}
                style={{
                  background: "linear-gradient(145deg,#10251c,#0b1713)",
                  border: "1px solid #284238",
                  borderRadius: "18px",
                  padding: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ color: "#37e28a", fontWeight: "800" }}>
                    {match.strLeague || "كرة القدم"}
                  </span>
                  <span style={{ color: "#9baaa4", fontSize: "13px" }}>
                    {statusLabel(match)}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "18px",
                    direction: "ltr",
                  }}
                >
                  <strong style={{ textAlign: "center", direction: "rtl" }}>
                    {match.strHomeTeam || "المضيف"}
                  </strong>

                  <span
                    style={{
                      color: "#37e28a",
                      fontSize: "22px",
                      fontWeight: "900",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {match.intHomeScore ?? "-"} - {match.intAwayScore ?? "-"}
                  </span>

                  <strong style={{ textAlign: "center", direction: "rtl" }}>
                    {match.strAwayTeam || "الضيف"}
                  </strong>
                </div>

                <a
                  href={`/matches/${match.idEvent}`}
                  style={{
                    display: "block",
                    marginTop: "16px",
                    padding: "11px",
                    borderRadius: "12px",
                    textAlign: "center",
                    textDecoration: "none",
                    color: "#d9e4df",
                    background: "rgba(55,226,138,.07)",
                    border: "1px solid rgba(55,226,138,.14)",
                    fontWeight: "800",
                  }}
                >
                  تفاصيل المباراة ←
                </a>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
