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
  if (isLive(match)) return "LIVE مباشر";
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

function teamLogo(team) {
  return team?.logo || team?.strTeamBadge || team?.badge || "";
}

function MatchCard({ match }) {
  const leagueName =
    match?.arabicLeague || match?.league?.name || match?.strLeague || "كرة القدم";
  const leaguePath = getLeaguePath(match);
  const homeName = match?.teams?.home?.name || match?.strHomeTeam || "المضيف";
  const awayName = match?.teams?.away?.name || match?.strAwayTeam || "الضيف";
  const homeScore = match?.goals?.home ?? match?.intHomeScore ?? "-";
  const awayScore = match?.goals?.away ?? match?.intAwayScore ?? "-";
  const homeLogo = teamLogo(match?.teams?.home);
  const awayLogo = teamLogo(match?.teams?.away);
  const live = isLive(match);
  const finished = isFinished(match);
  const eventId = match?.eventId || match?.idEvent || match?.fixture?.id;

  return (
    <article className={`today-match-card ${live ? "is-live" : ""} ${finished ? "is-finished" : ""}`}>
      <div className="today-match-card-top">
        <a href={leaguePath} className="today-league-link">
          <span className="today-league-mark">LG</span>
          <span>{leagueName}</span>
        </a>
        <span className={`today-status ${live ? "is-live" : ""} ${finished ? "is-finished" : ""}`}>
          {live ? "LIVE" : finished ? "FT" : "NEXT"}
        </span>
      </div>

      <div className="today-match-time">
        {statusLabel(match)}
      </div>

      <div className="today-match-score-row">
        <div className="today-team">
          {homeLogo ? (
            <img src={homeLogo} alt="" className="today-team-logo" loading="lazy" />
          ) : (
            <span className="today-team-logo-fallback">FC</span>
          )}
          <strong>{homeName}</strong>
        </div>

        <div className={`today-score ${live ? "is-live" : ""}`}>
          <span>{homeScore}</span>
          <b>:</b>
          <span>{awayScore}</span>
        </div>

        <div className="today-team">
          {awayLogo ? (
            <img src={awayLogo} alt="" className="today-team-logo" loading="lazy" />
          ) : (
            <span className="today-team-logo-fallback">FC</span>
          )}
          <strong>{awayName}</strong>
        </div>
      </div>

      <div className="today-match-actions">
        <a href={`/teams/${encodeURIComponent(homeName)}`} className="today-team-link">
          {homeName}
        </a>
        <a href={`/matches/${eventId}`} className="today-details-link">
          تفاصيل المباراة <span>←</span>
        </a>
        <a href={`/teams/${encodeURIComponent(awayName)}`} className="today-team-link">
          {awayName}
        </a>
      </div>
    </article>
  );
}

function MatchSection({ title, kicker, matches, tone = "default" }) {
  if (!matches.length) return null;

  return (
    <section className={`today-match-section tone-${tone}`}>
      <div className="today-section-heading">
        <div>
          <p>{kicker}</p>
          <h2>{title}</h2>
        </div>
        <span>{matches.length} مباراة</span>
      </div>

      <div className="today-match-grid">
        {matches.map((match) => (
          <MatchCard
            key={match?.eventId || match?.idEvent || match?.fixture?.id}
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
      className="today-matches-page"
      style={{
        minHeight: "100vh",
        background: "#07100d",
        color: "#f4f8f6",
        padding: "30px 16px 60px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div className="today-matches-container" style={{ maxWidth: "1100px", margin: "0 auto" }}>
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

        <header className="today-matches-hero" style={{ margin: "30px 0 22px" }}>
          <p style={{ color: "#37e28a", fontWeight: "800", marginBottom: 8 }}>
            MATCH CENTER
          </p>
          <h1 style={{ fontSize: "clamp(28px, 6vw, 46px)", margin: "8px 0" }}>
            مباريات اليوم ونتائج كرة القدم
          </h1>
          <p style={{ color: "#8fa099", lineHeight: "1.8", marginBottom: 0 }}>
            مباشر، مباريات اليوم، النتائج والبطولات المتاحة مجانًا في مكان واحد.
          </p>
        </header>

        <div className="today-matches-stats"
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
              className="today-matches-stat"
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
          <section className="today-empty-state"
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
