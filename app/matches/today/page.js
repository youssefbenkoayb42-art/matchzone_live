const BASE_URL = "https://matchzone-live.vercel.app";

const LIVE_STATUSES = ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"];
const FINISHED_STATUSES = ["FT", "AET", "PEN"];

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizeStatus(match) {
  return String(
    match?.fixture?.status?.short ||
      match?.fixture?.status?.long ||
      match?.strStatus ||
      ""
  ).toUpperCase();
}

function isLive(match) {
  return LIVE_STATUSES.includes(normalizeStatus(match));
}

function isFinished(match) {
  return FINISHED_STATUSES.includes(normalizeStatus(match));
}

function statusLabel(match) {
  if (isLive(match)) return "🔴 مباشر";
  if (isFinished(match)) return "انتهت";
  return match?.fixture?.date
    ? new Date(match.fixture.date).toLocaleTimeString("ar-MA", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Casablanca",
      })
    : "لم تبدأ";
}

function getLeaguePath(match) {
  const leagueId = match?.league?.id;
  const featured = {
    4328: "premier-league",
    4335: "la-liga",
    4332: "serie-a",
    4331: "bundesliga",
    4334: "ligue-1",
  };

  return featured[leagueId]
    ? `/leagues/${featured[leagueId]}`
    : leagueId
      ? `/leagues/league-${leagueId}`
      : "/leagues";
}

async function getTodayMatches() {
  try {
    const res = await fetch(`${BASE_URL}/api/football`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    const today = getTodayKey();

    return (Array.isArray(data?.response) ? data.response : [])
      .filter((match) => {
        const date = match?.fixture?.date;
        if (!date) return false;

        return new Intl.DateTimeFormat("en-CA", {
          timeZone: "Africa/Casablanca",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(date)) === today;
      })
      .sort(
        (a, b) =>
          new Date(a?.fixture?.date || 0) -
          new Date(b?.fixture?.date || 0)
      );
  } catch {
    return [];
  }
}

export const metadata = {
  title: "مباريات اليوم",
  description:
    "مباريات اليوم ونتائج كرة القدم ومواعيد البطولات المتاحة مجانًا على MatchZone.",
  alternates: {
    canonical: `${BASE_URL}/matches/today`,
  },
};

function MatchCard({ match }) {
  const leagueName =
    match?.arabicLeague || match?.league?.name || "كرة القدم";
  const leaguePath = getLeaguePath(match);
  const homeName = match?.teams?.home?.name || "المضيف";
  const awayName = match?.teams?.away?.name || "الضيف";
  const homeScore = match?.goals?.home ?? "-";
  const awayScore = match?.goals?.away ?? "-";

  return (
    <article
      style={{
        background: "linear-gradient(145deg,#10251c,#0b1713)",
        border: "1px solid #284238",
        borderRadius: "18px",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <a
          href={leaguePath}
          style={{
            color: "#37e28a",
            fontWeight: "800",
            textDecoration: "none",
          }}
        >
          {leagueName}
        </a>
        <span
          style={{
            color: isLive(match) ? "#37e28a" : "#9baaa4",
            fontSize: "13px",
            fontWeight: "800",
          }}
        >
          {statusLabel(match)}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: "10px",
          marginTop: "18px",
          direction: "ltr",
        }}
      >
        <strong style={{ textAlign: "center", direction: "rtl" }}>
          {homeName}
        </strong>

        <span
          style={{
            color: "#37e28a",
            fontSize: "22px",
            fontWeight: "900",
            whiteSpace: "nowrap",
          }}
        >
          {homeScore} - {awayScore}
        </span>

        <strong style={{ textAlign: "center", direction: "rtl" }}>
          {awayName}
        </strong>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginTop: "16px",
        }}
      >
        <a
          href={`/teams/${encodeURIComponent(homeName)}`}
          style={{
            padding: "9px",
            borderRadius: "10px",
            textAlign: "center",
            textDecoration: "none",
            color: "#b9c9c2",
            background: "rgba(255,255,255,.03)",
            border: "1px solid rgba(255,255,255,.06)",
            fontSize: "13px",
          }}
        >
          {homeName}
        </a>
        <a
          href={`/teams/${encodeURIComponent(awayName)}`}
          style={{
            padding: "9px",
            borderRadius: "10px",
            textAlign: "center",
            textDecoration: "none",
            color: "#b9c9c2",
            background: "rgba(255,255,255,.03)",
            border: "1px solid rgba(255,255,255,.06)",
            fontSize: "13px",
          }}
        >
          {awayName}
        </a>
      </div>

      <a
        href={`/matches/${match?.eventId || match?.fixture?.id}`}
        style={{
          display: "block",
          marginTop: "10px",
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
  );
}

function MatchSection({ title, kicker, matches }) {
  if (!matches.length) return null;

  return (
    <section style={{ marginTop: "30px" }}>
      <div style={{ marginBottom: "14px" }}>
        <p
          style={{
            margin: 0,
            color: "#37e28a",
            fontSize: "12px",
            fontWeight: "900",
            letterSpacing: "1.5px",
          }}
        >
          {kicker}
        </p>
        <h2 style={{ margin: "5px 0 0", fontSize: "22px" }}>{title}</h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: "14px",
        }}
      >
        {matches.map((match) => (
          <MatchCard
            key={match?.eventId || match?.fixture?.id}
            match={match}
          />
        ))}
      </div>
    </section>
  );
}

export default async function TodayMatchesPage() {
  const matches = await getTodayMatches();
  const live = matches.filter(isLive);
  const finished = matches.filter(isFinished);
  const scheduled = matches.filter(
    (match) => !isLive(match) && !isFinished(match)
  );

  const leagueCount = new Set(
    matches.map((match) => match?.league?.id).filter(Boolean)
  ).size;

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
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
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

        <header style={{ margin: "30px 0 22px" }}>
          <p style={{ color: "#37e28a", fontWeight: "800", marginBottom: 8 }}>
            ⚽ MATCH CENTER
          </p>
          <h1 style={{ fontSize: "clamp(28px, 6vw, 46px)", margin: "8px 0" }}>
            مباريات اليوم ونتائج كرة القدم
          </h1>
          <p style={{ color: "#8fa099", lineHeight: "1.8", marginBottom: 0 }}>
            مباشر، مباريات اليوم، النتائج والبطولات المتاحة مجانًا في مكان واحد.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "10px",
          }}
        >
          {[
            ["مباشر", live.length],
            ["مباريات اليوم", matches.length],
            ["البطولات", leagueCount],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: "15px 10px",
                textAlign: "center",
                borderRadius: "16px",
                background: "#10251c",
                border: "1px solid #284238",
              }}
            >
              <strong style={{ display: "block", fontSize: "24px" }}>
                {value}
              </strong>
              <span style={{ color: "#8fa099", fontSize: "12px" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {matches.length === 0 ? (
          <section
            style={{
              marginTop: "28px",
              padding: "35px 20px",
              borderRadius: "20px",
              background: "#10251c",
              border: "1px solid #284238",
              textAlign: "center",
            }}
          >
            لا توجد مباريات متاحة حاليًا. جرّب تحديث الصفحة لاحقًا.
          </section>
        ) : (
          <>
            <MatchSection title="مباشر الآن" kicker="LIVE" matches={live} />
            <MatchSection
              title="المباريات القادمة اليوم"
              kicker="UPCOMING"
              matches={scheduled}
            />
            <MatchSection
              title="نتائج اليوم"
              kicker="FINISHED"
              matches={finished}
            />
          </>
        )}
      </div>
    </main>
  );
}
