import LiveMatchRefresh from "./LiveMatchRefresh";

const BASE_URL = "https://matchzone-live.vercel.app";

async function getMatch(id) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/match/${encodeURIComponent(id)}`,
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data?.response?.[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const match = await getMatch(id);

  if (!match) {
    return {
      title: "المباراة غير موجودة | MatchZone",
      description: "تعذر العثور على تفاصيل المباراة المطلوبة.",
    };
  }

  const home = match.teams?.home?.name || "الفريق المضيف";
  const away = match.teams?.away?.name || "الفريق الضيف";
  const league = match.league?.name || "كرة القدم";
  const title = `${home} ضد ${away} | النتيجة والتفاصيل | MatchZone`;
  const description = `موعد ونتيجة ${home} ضد ${away} في ${league} مع أحداث المباراة والإحصائيات المتاحة.`;
  const url = `${BASE_URL}/matches/${encodeURIComponent(id)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [match.teams?.home?.logo, match.teams?.away?.logo].filter(Boolean),
    },
    twitter: { card: "summary", title, description },
  };
}

function Team({ team, score, side }) {
  return (
    <div style={{ minWidth: 0, textAlign: "center" }}>
      <div
        style={{
          width: "clamp(68px, 20vw, 104px)",
          height: "clamp(68px, 20vw, 104px)",
          margin: "0 auto",
          display: "grid",
          placeItems: "center",
          borderRadius: 22,
          background: "#07100d",
          border: "1px solid #284238",
          overflow: "hidden",
        }}
      >
        {team?.logo ? (
          <img
            src={team.logo}
            alt={team.name || "شعار الفريق"}
            width="88"
            height="88"
            style={{ width: "78%", height: "78%", objectFit: "contain" }}
          />
        ) : (
          <span style={{ color: "#37e28a", fontWeight: 900, fontSize: 20 }}>FC</span>
        )}
      </div>
      <h2
        style={{
          margin: "14px auto 0",
          maxWidth: 190,
          fontSize: "clamp(14px, 4vw, 20px)",
          lineHeight: 1.35,
          overflowWrap: "anywhere",
        }}
      >
        <a
          href={`/teams/${encodeURIComponent(team?.name || "")}`}
          style={{ color: "#f4f8f6", textDecoration: "none" }}
        >
          {team?.name || "فريق غير معروف"}
        </a>
      </h2>
      <span style={{ color: "#82968d", fontSize: 12 }}>
        {side === "home" ? "المضيف" : "الضيف"}
      </span>
    </div>
  );
}

function StatusPill({ status }) {
  const live = status === "LIVE";
  const finished = ["FT", "AET", "PEN"].includes(status);
  const label = live ? "● مباشر الآن" : finished ? "انتهت المباراة" : status === "POSTPONED" ? "تأجلت المباراة" : "لم تبدأ";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        borderRadius: 999,
        padding: "8px 14px",
        border: "1px solid #284238",
        background: live ? "#32171a" : "#0b1713",
        color: live ? "#ff7b7b" : "#37e28a",
        fontWeight: 900,
      }}
    >
      {label}
    </span>
  );
}

export default async function MatchPage({ params }) {
  const { id } = await params;
  const match = await getMatch(id);

  if (!match) {
    return (
      <main dir="rtl" style={{ minHeight: "100vh", background: "#07100d", color: "#f4f8f6", padding: 40, textAlign: "center" }}>
        <h1>لم يتم العثور على المباراة</h1>
        <a href="/" style={{ color: "#37e28a", textDecoration: "none", fontWeight: 800 }}>← العودة إلى MatchZone</a>
      </main>
    );
  }

  const status = String(match.fixture?.status?.short || "NS").toUpperCase();
  const homeScore = match.goals?.home;
  const awayScore = match.goals?.away;
  const home = match.teams?.home;
  const away = match.teams?.away;
  const league = match.league || {};
  const events = Array.isArray(match.timeline) ? match.timeline : [];
  const stats = Array.isArray(match.stats) ? match.stats : [];
  const isLive = status === "LIVE";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${home?.name || "الفريق المضيف"} vs ${away?.name || "الفريق الضيف"}`,
    description: `مباراة ${home?.name || ""} ضد ${away?.name || ""} في ${league.name || "كرة القدم"}`,
    startDate: match.fixture?.date,
    url: `${BASE_URL}/matches/${encodeURIComponent(id)}`,
    sport: "Football",
    homeTeam: { "@type": "SportsTeam", name: home?.name },
    awayTeam: { "@type": "SportsTeam", name: away?.name },
    eventStatus: isLive
      ? "https://schema.org/EventInProgress"
      : ["FT", "AET", "PEN"].includes(status)
      ? "https://schema.org/EventCompleted"
      : "https://schema.org/EventScheduled",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <main dir="rtl" style={{ minHeight: "100vh", background: "#07100d", color: "#f4f8f6", padding: "24px 14px 50px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <a href="/" style={{ color: "#37e28a", textDecoration: "none", fontWeight: 800 }}>← مباريات MatchZone</a>
            <span style={{ color: "#82968d", fontSize: 13 }}>MatchZone • تفاصيل المباراة</span>
          </header>

          <nav aria-label="مسار التنقل" style={{ display: "flex", flexWrap: "wrap", gap: 8, color: "#82968d", fontSize: 13, marginBottom: 18 }}>
            <a href="/" style={{ color: "#37e28a", textDecoration: "none" }}>الرئيسية</a>
            <span>←</span>
            <span>{league.name || "كرة القدم"}</span>
            <span>←</span>
            <span>{home?.name} ضد {away?.name}</span>
          </nav>

          <section
            style={{
              background: "linear-gradient(145deg,#10251c,#0b1713)",
              border: "1px solid #284238",
              borderRadius: 26,
              padding: "28px 16px",
              boxShadow: "0 24px 70px #0008",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <a href="/leagues" style={{ color: "#37e28a", textDecoration: "none", fontWeight: 800 }}>
                {league.name || "كرة القدم"}
              </a>
              <div style={{ marginTop: 12 }}><StatusPill status={status} /></div>
            </div>

            <LiveMatchRefresh
              matchId={match.eventId || id}
              initialStatus={status}
              initialHome={homeScore}
              initialAway={awayScore}
            />

            <div style={{ textAlign: "center", color: "#82968d", fontSize: 13, margin: "12px 0 24px" }}>
              {match.fixture?.date
                ? new Date(match.fixture.date).toLocaleString("ar-MA", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "الموعد غير متاح"}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)",
                alignItems: "center",
                gap: "clamp(8px,3vw,28px)",
                direction: "ltr",
              }}
            >
              <div style={{ direction: "rtl" }}><Team team={home} score={homeScore} side="home" /></div>
              <div style={{ textAlign: "center", direction: "ltr", minWidth: 90 }}>
                <strong style={{ display: "block", fontSize: "clamp(30px,8vw,48px)", color: "#37e28a", lineHeight: 1 }}>
                  {homeScore ?? "—"} - {awayScore ?? "—"}
                </strong>
                <span style={{ display: "block", color: "#82968d", marginTop: 10, fontSize: 12 }}>
                  {status === "NS" ? "لم تبدأ" : status}
                </span>
              </div>
              <div style={{ direction: "rtl" }}><Team team={away} score={awayScore} side="away" /></div>
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 18 }}>
            <a href={`/teams/${encodeURIComponent(home?.name || "")}`} style={{ color: "#f4f8f6", textDecoration: "none", textAlign: "center", background: "#0b1713", border: "1px solid #284238", borderRadius: 16, padding: 14, fontWeight: 800 }}>
              صفحة {home?.name || "الفريق المضيف"}
            </a>
            <a href={`/teams/${encodeURIComponent(away?.name || "")}`} style={{ color: "#f4f8f6", textDecoration: "none", textAlign: "center", background: "#0b1713", border: "1px solid #284238", borderRadius: 16, padding: 14, fontWeight: 800 }}>
              صفحة {away?.name || "الفريق الضيف"}
            </a>
          </section>

          {events.length > 0 && (
            <section style={{ marginTop: 22, background: "#0b1713", border: "1px solid #284238", borderRadius: 22, padding: 20 }}>
              <p style={{ color: "#37e28a", fontWeight: 800, margin: 0 }}>أحداث المباراة</p>
              <h2 style={{ marginTop: 6 }}>الخط الزمني</h2>
              <div style={{ display: "grid", gap: 8 }}>
                {events.map((event, index) => (
                  <div key={String(event.time || "") + index} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: 12, borderRadius: 12, background: "#07100d", border: "1px solid #193126" }}>
                    <span>{event.team === "away" ? "" : (event.player || event.type || "حدث")}</span>
                    <strong style={{ color: "#37e28a", whiteSpace: "nowrap" }}>{event.time || "—"}</strong>
                    <span>{event.team === "away" ? (event.player || event.type || "حدث") : ""}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {stats.length > 0 && (
            <section style={{ marginTop: 22, background: "#0b1713", border: "1px solid #284238", borderRadius: 22, padding: 20 }}>
              <p style={{ color: "#37e28a", fontWeight: 800, margin: 0 }}>إحصائيات المباراة</p>
              <h2 style={{ marginTop: 6 }}>مقارنة الفريقين</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {stats.map((stat, index) => (
                  <div key={String(stat.name || "stat") + index} style={{ background: "#07100d", borderRadius: 12, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <strong>{stat.home ?? "—"}</strong>
                      <span style={{ color: "#82968d" }}>{stat.name || "إحصائية"}</span>
                      <strong>{stat.away ?? "—"}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section style={{ marginTop: 22, background: "#0b1713", border: "1px solid #284238", borderRadius: 22, padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>عن المباراة</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
              <div style={{ background: "#07100d", borderRadius: 12, padding: 12, textAlign: "center" }}>
                <small style={{ color: "#82968d", display: "block" }}>البطولة</small>
                <strong>{league.name || "غير محدد"}</strong>
              </div>
              <div style={{ background: "#07100d", borderRadius: 12, padding: 12, textAlign: "center" }}>
                <small style={{ color: "#82968d", display: "block" }}>المصدر</small>
                <strong>{match.source || "MatchZone"}</strong>
              </div>
            </div>
          </section>

          <footer style={{ textAlign: "center", color: "#82968d", fontSize: 12, marginTop: 28 }}>
            MatchZone — النتائج والمواعيد والأحداث المتاحة مجانًا.
          </footer>
        </div>
      </main>
    </>
  );
}
