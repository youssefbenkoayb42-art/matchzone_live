import { getOpenFootballLeagueData } from "../../../lib/openfootball";

const LEAGUES = {
  "premier-league": { id: 4328, name: "الدوري الإنجليزي الممتاز", english: "Premier League", description: "مباريات ونتائج الدوري الإنجليزي الممتاز ومواعيد أهم المواجهات." },
  "la-liga": { id: 4335, name: "الدوري الإسباني", english: "La Liga", description: "مباريات ونتائج الدوري الإسباني ومواعيد أهم المواجهات." },
  "serie-a": { id: 4332, name: "الدوري الإيطالي", english: "Serie A", description: "مباريات ونتائج الدوري الإيطالي ومواعيد أهم المواجهات." },
  "bundesliga": { id: 4331, name: "الدوري الألماني", english: "Bundesliga", description: "مباريات ونتائج الدوري الألماني ومواعيد أهم المواجهات." },
  "ligue-1": { id: 4334, name: "الدوري الفرنسي", english: "Ligue 1", description: "مباريات ونتائج الدوري الفرنسي ومواعيد أهم المواجهات." },
};

const BASE_URL = "https://matchzone-live.vercel.app";

async function getLeague(slug) {
  if (LEAGUES[slug]) return LEAGUES[slug];

  const match = String(slug || "").match(/^league-(\\d+)$/);
  if (!match) return null;

  try {
    const res = await fetch(
      "https://www.thesportsdb.com/api/v1/json/123/lookupleague.php?id=" + match[1],
      { next: { revalidate: 900 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const item = Array.isArray(data?.leagues) ? data.leagues[0] : null;
    if (!item?.idLeague) return null;

    return {
      id: Number(item.idLeague),
      name: item.strLeague || "بطولة كرة القدم",
      english: item.strLeagueAlternate || item.strLeague || "Football League",
      country: item.strCountry || "",
      badge: item.strBadge || item.strLogo || null,
      description: "مباريات ونتائج ومواعيد " + (item.strLeague || "البطولة") + ".",
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const league = await getLeague(params.slug);
  if (!league) return { title: "البطولة غير موجودة" };
  return {
    title: league.name + " - مباريات ونتائج",
    description: league.description,
    alternates: { canonical: BASE_URL + "/leagues/" + params.slug },
  };
}

async function getEvents(leagueId, endpoint) {
  try {
    const res = await fetch(
      "https://www.thesportsdb.com/api/v1/json/123/" + endpoint + ".php?id=" + leagueId,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.events) ? data.events : [];
  } catch {
    return [];
  }
}

async function getLeagueTeams(leagueName) {
  try {
    const res = await fetch(
      "https://www.thesportsdb.com/api/v1/json/123/search_all_teams.php?l=" +
        encodeURIComponent(leagueName),
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.teams) ? data.teams : [];
  } catch {
    return [];
  }
}

function adaptOpenFootballMatch(match) {
  const isFinished = match?.fixture?.status?.short === "FT";
  return {
    idEvent: match?.eventId || null,
    strHomeTeam: match?.teams?.home?.name || "",
    strAwayTeam: match?.teams?.away?.name || "",
    strHomeTeamBadge: match?.teams?.home?.logo || null,
    strAwayTeamBadge: match?.teams?.away?.logo || null,
    intHomeScore: match?.goals?.home ?? null,
    intAwayScore: match?.goals?.away ?? null,
    dateEvent: match?.fixture?.date || "",
    strTime: match?.fixture?.date
      ? new Date(match.fixture.date).toISOString().slice(11, 16)
      : "",
    source: match?.source || "openfootball/football.json",
    openFootball: true,
    isFinished,
  };
}

function sortLeagueMatches(matches) {
  return [...matches].sort((a, b) => {
    const aDate = new Date(
      a?.fixture?.date || a?.dateEvent || "2100-01-01"
    ).getTime();
    const bDate = new Date(
      b?.fixture?.date || b?.dateEvent || "2100-01-01"
    ).getTime();
    return aDate - bDate;
  });
}

async function getOpenFootballFallback(slug) {
  if (!["premier-league", "la-liga", "serie-a", "bundesliga", "ligue-1"].includes(slug)) {
    return { today: [], upcoming: [], results: [] };
  }

  try {
    const data = await getOpenFootballLeagueData(slug);
    const matches = Array.isArray(data?.matches)
      ? data.matches
      : [];

    const todayKey = new Date().toISOString().slice(0, 10);
    const today = matches.filter(
      (match) => match?.fixture?.date === todayKey
    );
    const upcoming = matches.filter(
      (match) =>
        !match?.goals ||
        match?.fixture?.status?.short !== "FT"
    );
    const results = matches.filter(
      (match) => match?.fixture?.status?.short === "FT"
    );

    return {
      today: sortLeagueMatches(today).map(adaptOpenFootballMatch),
      upcoming: sortLeagueMatches(upcoming).map(adaptOpenFootballMatch),
      results: sortLeagueMatches(results)
        .reverse()
        .map(adaptOpenFootballMatch),
    };
  } catch {
    return { today: [], upcoming: [], results: [] };
  }
}

async function getTodayMatches(leagueId) {
  const date = new Date().toISOString().slice(0, 10);
  try {
    const res = await fetch(
      "https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=" + date + "&l=" + leagueId,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.events) ? data.events : [];
  } catch {
    return [];
  }
}

function MatchCard({ match, league, featured = false }) {
  const isFinished = Boolean(match.intHomeScore != null && match.intAwayScore != null);
  return (
    <article className={featured ? "league-match-card league-match-card-featured" : "league-match-card"} style={featured ? { ...styles.card, ...styles.featuredCard } : styles.card}>
      <div style={styles.competition}>{league.english}</div>
      <div style={styles.status}>{isFinished ? "النتيجة النهائية" : "المباراة القادمة"}</div>
      <div style={styles.teams}>
        <a href={"/teams/" + encodeURIComponent(match.strHomeTeam || "")} style={styles.team}>
          {match.strHomeTeamBadge ? (
            <img src={match.strHomeTeamBadge} alt={match.strHomeTeam || "الفريق المضيف"} style={styles.matchTeamLogo} loading="lazy" />
          ) : (
            <span style={styles.matchTeamFallback}>TM</span>
          )}
          <strong>{match.strHomeTeam || "الفريق المضيف"}</strong>
          <small style={styles.teamSmall}>المضيف</small>
        </a>
        <div style={styles.score}>
          {isFinished ? (match.intHomeScore + " - " + match.intAwayScore) : (match.strTime || "-")}
        </div>
        <a href={"/teams/" + encodeURIComponent(match.strAwayTeam || "")} style={styles.team}>
          {match.strAwayTeamBadge ? (
            <img src={match.strAwayTeamBadge} alt={match.strAwayTeam || "الفريق الضيف"} style={styles.matchTeamLogo} loading="lazy" />
          ) : (
            <span style={styles.matchTeamFallback}>TM</span>
          )}
          <strong>{match.strAwayTeam || "الفريق الضيف"}</strong>
          <small style={styles.teamSmall}>الضيف</small>
        </a>
      </div>
      <div style={styles.meta}>
        {match.dateEvent || ""}{match.strTime ? " • " + match.strTime : ""}
      </div>
      {match.idEvent ? (
        <a href={"/matches/" + match.idEvent} style={styles.button}>عرض تفاصيل المباراة ←</a>
      ) : (
        <a href="/matches/today" style={styles.button}>مركز المباريات ←</a>
      )}
    </article>
  );
}

export default async function LeaguePage({ params }) {
  const league = await getLeague(params.slug);

  if (!league) {
    return (
      <main style={styles.main}>
        <h1>البطولة غير موجودة</h1>
        <a href="/leagues" style={styles.link}>العودة إلى البطولات</a>
      </main>
    );
  }

  const [todayFromSportsDb, upcomingFromSportsDb, resultsFromSportsDb, teams, openFootballFallback] = await Promise.all([
    getTodayMatches(league.id),
    getEvents(league.id, "eventsnextleague"),
    getEvents(league.id, "eventspastleague"),
    getLeagueTeams(league.english),
    getOpenFootballFallback(params.slug),
  ]);

  const today = todayFromSportsDb.length
    ? todayFromSportsDb
    : openFootballFallback.today;

  const upcoming = upcomingFromSportsDb.length
    ? upcomingFromSportsDb
    : openFootballFallback.upcoming;

  const results = resultsFromSportsDb.length
    ? resultsFromSportsDb
    : openFootballFallback.results;

  const upcomingMatches = upcoming.slice(0, 5);
  const recentResults = results.slice(0, 5);
  const leagueTeams = teams.slice(0, 24);
  const leagueUrl = BASE_URL + "/leagues/" + params.slug;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: league.name,
    url: leagueUrl,
    sport: "Soccer",
    ...(league.badge ? { logo: league.badge } : {}),
    ...(league.country ? { location: { "@type": "Country", name: league.country } } : {}),
  };

  return (
    <main style={styles.main} className="league-page-shell" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={styles.container} className="league-page-container">
        <a href="/leagues" style={styles.link}>← كل البطولات</a>

        <header style={styles.header} className="league-page-hero">
          <div style={styles.logoBox}>{league.badge ? <img src={league.badge} alt="" style={styles.leagueLogo} /> : <span style={styles.leagueFallback}>L</span>}</div>
          <div style={{ flex: 1 }}>
            <div style={styles.eyebrow}>MATCHZONE • LEAGUE</div>
            <h1 style={styles.h1}>{league.name}</h1>
            <p style={styles.muted}>{league.description}{league.country ? " • " + league.country : ""}</p>
          </div>
        </header>

        <div style={styles.stats} className="league-page-stats" aria-label="ملخص البطولة">
          <div style={styles.statBox}><strong>{today.length}</strong><span>اليوم</span></div>
          <div style={styles.statBox}><strong>{upcomingMatches.length}</strong><span>قادمة</span></div>
          <div style={styles.statBox}><strong>{recentResults.length}</strong><span>نتائج</span></div>
        </div>

        <nav style={styles.infoStrip} className="league-command-strip" aria-label="مركز البطولة">
          <a href={"/standings/" + params.slug} style={styles.infoLink} className="league-command-link">
            <span className="ui-glyph mini-glyph">TAB</span>
            <strong>الترتيب</strong>
            <small>النقاط والمراكز</small>
          </a>
          <a href="#teams" style={styles.infoLink} className="league-command-link">
            <span className="ui-glyph mini-glyph">FC</span>
            <strong>الفرق</strong>
            <small>{leagueTeams.length} فريقًا</small>
          </a>
          <a href="#upcoming" style={styles.infoLink} className="league-command-link">
            <span className="ui-glyph mini-glyph">NEXT</span>
            <strong>القادمة</strong>
            <small>أقرب المواجهات</small>
          </a>
          <a href="#results" style={styles.infoLink} className="league-command-link">
            <span className="ui-glyph mini-glyph">FT</span>
            <strong>النتائج</strong>
            <small>آخر المباريات</small>
          </a>
        </nav>

        <section className="league-page-section">
          <div className="league-section-heading"><div><span>LIVE / TODAY</span><strong>مباريات {league.name} اليوم</strong></div><small>{today.length} مباراة</small></div>
          {today.length === 0 ? (
            <div style={styles.empty}>لا توجد مباريات مسجلة لهذه البطولة اليوم.</div>
          ) : (
            <div style={styles.grid}>{today.map((match) => <MatchCard key={match.idEvent} match={match} league={league} />)}</div>
          )}
        </section>

        <section id="upcoming" className="league-page-section">
          <div className="league-section-heading"><div><span>NEXT</span><strong>المباراة القادمة</strong></div><small>{upcomingMatches.length} مباريات متاحة</small></div>
          {upcomingMatches.length === 0 ? (
            <div style={styles.empty}>لا توجد مباريات قادمة متاحة حالياً.</div>
          ) : (
            <MatchCard match={upcomingMatches[0]} league={league} featured />
          )}

          {upcomingMatches.length > 1 && (
            <>
              <div className="league-section-heading"><div><span>UPCOMING</span><strong>باقي المباريات القادمة</strong></div><small>أقرب المواعيد</small></div>
              <div style={styles.grid}>{upcomingMatches.slice(1).map((match) => <MatchCard key={match.idEvent} match={match} league={league} />)}</div>
            </>
          )}
        </section>

        <section id="teams" className="league-page-section">
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionKicker}>TEAMS</div>
              <h2 style={{ ...styles.h2, marginTop: 4 }}>فرق {league.name}</h2>
            </div>
            <a href="/matches/today" style={styles.sectionLink}>مباريات اليوم ←</a>
          </div>
          {leagueTeams.length === 0 ? (
            <div style={styles.empty}>لا توجد قائمة فرق متاحة لهذه البطولة حالياً.</div>
          ) : (
            <div style={styles.teamGrid}>
              {leagueTeams.map((team) => (
                <a
                  key={team.idTeam}
                  href={"/teams/" + encodeURIComponent(team.strTeam || "")}
                  className="league-team-card"
                  style={styles.teamCard}
                >
                  {team.strTeamBadge ? (
                    <img src={team.strTeamBadge} alt="" style={styles.teamLogo} />
                  ) : (
                    <div style={styles.teamFallback}>TM</div>
                  )}
                  <strong>{team.strTeam}</strong>
                  <span style={styles.teamCardSpan}>مباريات الفريق ←</span>
                </a>
              ))}
            </div>
          )}
        </section>

        <section id="results" className="league-page-section">
          <div className="league-section-heading"><div><span>RESULTS</span><strong>آخر النتائج</strong></div><small>أحدث النتائج</small></div>
          {recentResults.length === 0 ? (
            <div style={styles.empty}>لا توجد نتائج سابقة متاحة حالياً.</div>
          ) : (
            <div style={styles.grid}>{recentResults.map((match) => <MatchCard key={match.idEvent} match={match} league={league} />)}</div>
          )}
        </section>

        <nav style={styles.nav} className="league-related-nav" aria-label="تصفح البطولات">
          {Object.entries(LEAGUES).filter(([slug]) => slug !== params.slug).map(([slug, item]) => (
            <a key={slug} href={"/leagues/" + slug} style={styles.navLink}>{item.name}</a>
          ))}
        </nav>

        <div style={styles.bottomLinks}>
          <a href="/matches/today" style={styles.link}>مباريات اليوم</a>
          <a href="/" style={styles.link}>الرئيسية</a>
        </div>
      </div>
    </main>
  );
}

const styles = {
  main: { minHeight: "100vh", background: "#07100d", color: "#f4f8f6", padding: "24px 16px 70px", fontFamily: "Arial, Helvetica, sans-serif" },
  container: { maxWidth: 1100, margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: 16, marginTop: 24, padding: "26px 22px", borderRadius: 24, background: "linear-gradient(145deg,#123326,#0b1712)", border: "1px solid #1e3d30", boxShadow: "0 18px 50px rgba(0,0,0,.22)" },
  logoBox: { width: 66, height: 66, borderRadius: 20, display: "grid", placeItems: "center", fontSize: 34, background: "rgba(46,204,113,.08)", border: "1px solid rgba(46,204,113,.18)", flexShrink: 0, overflow: "hidden" },
  leagueFallback: { color: "#39e58b", fontSize: 20, fontWeight: 950, letterSpacing: 2, textShadow: "0 0 12px rgba(57,229,139,.55)" },
  leagueLogo: { width: "82%", height: "82%", objectFit: "contain" },
  eyebrow: { color: "#2ecc71", fontSize: 10, fontWeight: 900, letterSpacing: 1, marginBottom: 7 },
  h1: { margin: 0, fontSize: "clamp(24px,5vw,38px)", lineHeight: 1.2 },
  h2: { margin: "35px 0 18px", fontSize: 22 },
  sectionHeader: { display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, marginTop: 10 },
  sectionKicker: { color: "#2ecc71", fontSize: 10, fontWeight: 900, letterSpacing: 1 },
  sectionLink: { color: "#82968d", textDecoration: "none", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" },
  muted: { color: "#82968d", margin: "8px 0 0", lineHeight: 1.7 },
  link: { color: "#2ecc71", textDecoration: "none", fontWeight: 800 },
  stats: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 },
  infoStrip: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 24, padding: 8, borderRadius: 16, background: "rgba(255,255,255,.025)", border: "1px solid rgba(57,229,139,.08)" },
  infoLink: { display: "flex", flexDirection: "column", gap: 3, padding: "10px 8px", borderRadius: 11, color: "#8fa198", textDecoration: "none", fontSize: 8, fontWeight: 900, letterSpacing: 1, textAlign: "center", background: "rgba(255,255,255,.025)" },
  statBox: { background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: "15px 10px", textAlign: "center" },
  statBoxStrong: { fontSize: 22, fontWeight: 900 },
  card: { background: "linear-gradient(145deg,#10251c,#0b1713)", border: "1px solid #1e3d30", borderRadius: 20, padding: 18, boxShadow: "0 12px 35px rgba(0,0,0,.14)" },
  featuredCard: { padding: 24, border: "1px solid rgba(46,204,113,.22)", background: "linear-gradient(145deg,#153b2a,#0b1713)" },
  competition: { color: "#2ecc71", fontSize: 12, fontWeight: 800, marginBottom: 6 },
  status: { color: "#82968d", fontSize: 11, marginBottom: 20 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 15 },
  teamGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 },
  teamCard: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 145, padding: 14, borderRadius: 18, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", color: "#f4f8f6", textDecoration: "none", textAlign: "center" },
  teamLogo: { width: 54, height: 54, objectFit: "contain" },
  teamFallback: { width: 54, height: 54, display: "grid", placeItems: "center", borderRadius: 16, background: "#10231b", fontSize: 25 },
  teamCardSpan: { color: "#718078", fontSize: 10 },
  teams: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", textAlign: "center", direction: "ltr" },
  team: { color: "#f4f8f6", textDecoration: "none", minWidth: 0, padding: 8, borderRadius: 12 },
  matchTeamLogo: { width: 52, height: 52, objectFit: "contain", display: "block", margin: "0 auto 8px" },
  matchTeamFallback: { width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 15, background: "#10231b", fontSize: 24, margin: "0 auto 8px" },
  teamSmall: { display: "block", color: "#718078", marginTop: 5, fontSize: 11 },
  score: { fontSize: 24, fontWeight: 900, whiteSpace: "nowrap" },
  meta: { color: "#718078", fontSize: 11, textAlign: "center", margin: "18px 0" },
  button: { display: "block", textAlign: "center", background: "rgba(46,204,113,.08)", border: "1px solid rgba(46,204,113,.14)", color: "#2ecc71", padding: 12, borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 12 },
  empty: { padding: 35, borderRadius: 18, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", color: "#82968d", textAlign: "center" },
  nav: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 35 },
  navLink: { color: "#b8c6bf", textDecoration: "none", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,.04)" },
  bottomLinks: { display: "flex", gap: 20, marginTop: 30, paddingTop: 20, borderTop: "1px solid #1e3d30" },
};
