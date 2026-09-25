import Link from "next/link";
import { notFound } from "next/navigation";

const BASE_URL = "https://matchzone-live.vercel.app";

const LEAGUES = [
  { slug: "premier-league", id: "4328", name: "الدوري الإنجليزي الممتاز", english: "Premier League", logo: "/leagues/premier-league.svg" },
  { slug: "la-liga", id: "4335", name: "الدوري الإسباني", english: "LaLiga", logo: "/leagues/la-liga.svg" },
  { slug: "serie-a", id: "4332", name: "الدوري الإيطالي", english: "Serie A", logo: "/leagues/serie-a.svg" },
  { slug: "bundesliga", id: "4331", name: "الدوري الألماني", english: "Bundesliga", logo: "/leagues/bundesliga.svg" },
  { slug: "ligue-1", id: "4334", name: "الدوري الفرنسي", english: "Ligue 1", logo: "/leagues/ligue-1.svg" },
];


export async function generateStaticParams() {
  return LEAGUES.map(({ slug }) => ({ league: slug }));
}

export async function generateMetadata({ params }) {
  const league = LEAGUES.find((item) => item.slug === params.league);
  return {
    title: league ? `ترتيب ${league.name}` : "ترتيب الدوري",
    description: league
      ? `جدول ترتيب ${league.name} مع النقاط والمباريات والانتصارات والتعادلات والخسائر.`
      : "جداول ترتيب دوريات كرة القدم.",
    alternates: {
      canonical: league
        ? `${BASE_URL}/standings/${league.slug}`
        : `${BASE_URL}/standings/${params.league}`,
    },
  };
}


async function getRecentForm(leagueId) {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/eventspastleague.php?id=${leagueId}`,
      { next: { revalidate: 300 } }
    );
    if (!response.ok) return {};
    const data = await response.json();
    const events = Array.isArray(data?.events) ? data.events : [];
    const finished = events
      .filter((event) => event?.idEvent && event?.idHomeTeam && event?.idAwayTeam && event?.intHomeScore != null && event?.intAwayScore != null)
      .sort((a, b) => {
        const aTime = new Date((a.dateEvent || "") + "T" + (a.strTime || "00:00:00")).getTime();
        const bTime = new Date((b.dateEvent || "") + "T" + (b.strTime || "00:00:00")).getTime();
        return bTime - aTime;
      });

    const form = {};
    for (const event of finished) {
      const homeId = String(event.idHomeTeam);
      const awayId = String(event.idAwayTeam);
      const homeScore = Number(event.intHomeScore);
      const awayScore = Number(event.intAwayScore);
      if (!form[homeId]) form[homeId] = [];
      if (!form[awayId]) form[awayId] = [];
      if (form[homeId].length < 5) {
        form[homeId].push({
          result: homeScore > awayScore ? "W" : homeScore < awayScore ? "L" : "D",
          opponent: event.strAwayTeam || "الخصم",
          score: homeScore + "-" + awayScore,
        });
      }
      if (form[awayId].length < 5) {
        form[awayId].push({
          result: awayScore > homeScore ? "W" : awayScore < homeScore ? "L" : "D",
          opponent: event.strHomeTeam || "الخصم",
          score: awayScore + "-" + homeScore,
        });
      }
    }
    return form;
  } catch {
    return {};
  }
}

async function getStandings(leagueId) {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/lookuptable.php?l=${leagueId}`,
      { next: { revalidate: 300 } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.table) ? data.table : [];
  } catch {
    return [];
  }
}

export default async function StandingsPage({ params }) {
  const league = LEAGUES.find((item) => item.slug === params.league);
  if (!league) notFound();

  const [table, recentForm] = await Promise.all([getStandings(league.id), getRecentForm(league.id)]);

  return (
    <main dir="rtl" style={styles.main} className="standings-page-shell">
      <div style={styles.container} className="standings-page-container">
        <Link href="/leagues" style={styles.back}>← البطولات</Link>

        <header style={styles.header} className="standings-page-hero">
          <div style={styles.logoWrap}>
            <img src={league.logo} alt={league.name + " شعار"} style={styles.logo} />
          </div>
          <div>
            <span style={styles.eyebrow}>MATCHZONE • STANDINGS</span>
            <h1 style={styles.title}>ترتيب {league.name}</h1>
            <p style={styles.muted}>جدول الترتيب الحالي مع النقاط ونتائج الفرق • يتجدد تلقائيًا كل 5 دقائق.</p>
            <div className="standings-legend" aria-label="مفتاح حالات الترتيب">
              <span><i className="standings-dot standings-dot-top" /> القمة</span>
              <span><i className="standings-dot standings-dot-europe" /> المراكز الأولى</span>
              <span><i className="standings-dot standings-dot-risk" /> مؤخرة الجدول</span>
            </div>
          </div>
        </header>

        <nav style={styles.leagueNav} className="standings-league-nav">
          {LEAGUES.map((item) => (
            <Link
              key={item.slug}
              href={`/standings/${item.slug}`}
              style={{
                ...styles.leagueLink,
                ...(item.slug === league.slug ? styles.activeLink : {}),
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <section style={styles.card} className="standings-table-card">
          {table.length ? (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={{ ...styles.th, textAlign: "right", minWidth: 180 }}>الفريق</th>
                    <th style={styles.th}>الحالة</th>
                    <th style={styles.th}>آخر 5</th>
                    <th style={styles.th}>لعب</th>
                    <th style={styles.th}>فوز</th>
                    <th style={styles.th}>تعادل</th>
                    <th style={styles.th}>خسارة</th>
                    <th style={styles.th}>له</th>
                    <th style={styles.th}>عليه</th>
                    <th style={styles.th}>+/-</th>
                    <th style={styles.th}>النقاط</th>
                    <th style={styles.th}>معدل النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((team, index) => {
                    const rank = Number(team?.intRank || index + 1);
                    const points = Number(team?.intPoints || 0);
                    const played = Number(team?.intPlayed || 0);
                    const pointsPerGame = played > 0 ? (points / played).toFixed(2) : "0.00";
                    const badge = team?.strBadge;
                    const goalDifference = Number(team?.intGoalDifference || 0);
                    const rankStyle =
                      rank === 1 ? styles.firstRank :
                      rank === 2 ? styles.secondRank :
                      rank === 3 ? styles.thirdRank : {};
                    const status =
                      rank === 1 ? "قمة" :
                      rank <= 4 ? "أوروبي" :
                      rank >= table.length - 2 ? "خطر" : "مستقر";
                    const statusClass =
                      rank === 1 ? "standings-status standings-status-top" :
                      rank <= 4 ? "standings-status standings-status-europe" :
                      rank >= table.length - 2 ? "standings-status standings-status-risk" :
                      "standings-status";
                    const form = recentForm[String(team?.idTeam)] || [];
                    return (
                      <tr key={team?.idTeam || team?.strTeam || index} style={rank <= 3 ? styles.highlightRow : undefined}>
                        <td style={{ ...styles.td, ...rankStyle, fontWeight: 900 }}>
                          <span className={rank <= 3 ? "standings-rank standings-rank-top" : "standings-rank"}>{String(rank).padStart(2, "0")}</span>
                        </td>
                        <td style={styles.teamCell}>
                          {badge ? <img src={badge} alt="" style={styles.teamLogo} loading="lazy" /> : null}
                          <Link
                            href={`/teams/${encodeURIComponent(team?.strTeam || "فريق")}`}
                            style={styles.teamLink}
                          >
                            {team?.strTeam || "فريق"}
                          </Link>
                        </td>
                        <td style={styles.td}><span className={statusClass}>{status}</span></td>
                        <td style={styles.formCell}>
                          <div className="standings-form" aria-label={"آخر " + form.length + " نتائج لـ " + (team?.strTeam || "الفريق")}>
                            {form.length ? form.map((item, formIndex) => (
                              <span
                                key={formIndex}
                                className={"standings-form-pill standings-form-" + item.result.toLowerCase()}
                                title={item.result + " • " + item.opponent + " • " + item.score}
                                aria-label={item.result + " ضد " + item.opponent + " بنتيجة " + item.score}
                              >
                                {item.result}
                              </span>
                            )) : <span className="standings-form-empty">—</span>}
                          </div>
                        </td>
                        <td style={styles.td}>{team?.intPlayed ?? 0}</td>
                        <td style={styles.td}>{team?.intWin ?? 0}</td>
                        <td style={styles.td}>{team?.intDraw ?? 0}</td>
                        <td style={styles.td}>{team?.intLoss ?? 0}</td>
                        <td style={styles.td}>{team?.intGoalsFor ?? 0}</td>
                        <td style={styles.td}>{team?.intGoalsAgainst ?? 0}</td>
                        <td style={{ ...styles.td, color: goalDifference > 0 ? "#2ecc71" : goalDifference < 0 ? "#ff7b7b" : "#dce7e2", fontWeight: 800 }}>
                          {goalDifference > 0 ? "+" + goalDifference : goalDifference}
                        </td>
                        <td style={{ ...styles.td, ...styles.points }}>{points}</td>
                        <td style={{ ...styles.td, color: "#8ff4b8", fontWeight: 800 }}>{pointsPerGame}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}><span className="ui-glyph">TAB</span></div>
              <h2>لا يوجد ترتيب متاح حاليًا</h2>
              <p>حاول تحديث الصفحة بعد قليل.</p>
            </div>
          )}
        </section>

        <div style={styles.footerLinks} className="standings-footer-links">
          <Link href={`/leagues/${league.slug}`} style={styles.footerLink}><span className="ui-glyph mini-glyph">FC</span> مباريات {league.name}</Link>
          <Link href="/matches/today" style={styles.footerLink}><span className="ui-glyph mini-glyph">DATE</span> مباريات اليوم</Link>
          <span style={styles.source}>مصدر البيانات: TheSportsDB</span>
        </div>
      </div>
    </main>
  );
}

const styles = {
  main: { minHeight: "100vh", background: "radial-gradient(circle at 50% -10%, rgba(46,204,113,.13), transparent 38%), #07100d", color: "#f4f8f6", padding: "28px 14px 70px", fontFamily: "Arial, Helvetica, sans-serif" },
  container: { maxWidth: 1100, margin: "0 auto" },
  back: { color: "#2ecc71", textDecoration: "none", fontWeight: 800, fontSize: 14 },
  header: { display: "flex", alignItems: "center", gap: 18, marginTop: 22, padding: "24px 20px", borderRadius: 26, background: "linear-gradient(145deg,#123326,#0b1712)", border: "1px solid #1e3d30", boxShadow: "0 18px 50px rgba(0,0,0,.22)" },
  logoWrap: { width: 70, height: 70, minWidth: 70, display: "grid", placeItems: "center", borderRadius: 19, background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)" },
  logo: { width: 50, height: 50, objectFit: "contain" },
  eyebrow: { display: "block", color: "#2ecc71", fontSize: 10, fontWeight: 900, letterSpacing: 1.5, marginBottom: 5 },
  title: { margin: 0, fontSize: "clamp(24px,5vw,38px)" },
  muted: { color: "#82968d", margin: "8px 0 0", fontSize: 13, lineHeight: 1.7 },
  leagueNav: { display: "flex", gap: 9, overflowX: "auto", padding: "18px 2px", scrollbarWidth: "thin" },
  leagueLink: { flex: "0 0 auto", color: "#b9c8c1", textDecoration: "none", padding: "10px 13px", borderRadius: 12, background: "#0d1c16", border: "1px solid #1e3d30", fontSize: 12, fontWeight: 800 },
  activeLink: { color: "#07100d", background: "#2ecc71", borderColor: "#2ecc71" },
  card: { overflow: "hidden", borderRadius: 24, background: "linear-gradient(145deg,#10251c,#0a1511)", border: "1px solid #1e3d30", boxShadow: "0 12px 35px rgba(0,0,0,.18)" },
  tableScroll: { overflowX: "auto", WebkitOverflowScrolling: "touch" },
  table: { width: "100%", minWidth: 980, borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "15px 10px", textAlign: "center", color: "#6f8c80", background: "#0b1913", fontSize: 11, whiteSpace: "nowrap" },
  td: { padding: "13px 10px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,.055)", color: "#dce7e2", whiteSpace: "nowrap" },
  formCell: { padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.055)", textAlign: "center", whiteSpace: "nowrap" },
  teamCell: { padding: "11px 12px", borderTop: "1px solid rgba(255,255,255,.055)", display: "flex", alignItems: "center", gap: 10, fontWeight: 800, whiteSpace: "nowrap" },
  teamLogo: { width: 28, height: 28, objectFit: "contain" },
  teamLink: { color: "#f4f8f6", textDecoration: "none", fontWeight: 800 },
  points: { color: "#2ecc71", fontWeight: 900, fontSize: 14 },
  highlightRow: { background: "rgba(46,204,113,.025)" },
  firstRank: { color: "#f5c542", fontSize: 16 },
  secondRank: { color: "#c7d0d5", fontSize: 16 },
  thirdRank: { color: "#c98b5a", fontSize: 16 },
  empty: { textAlign: "center", padding: "55px 20px", color: "#82968d" },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  footerLinks: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 20 },
  footerLink: { color: "#2ecc71", textDecoration: "none", padding: "10px 13px", borderRadius: 12, background: "rgba(46,204,113,.07)", border: "1px solid rgba(46,204,113,.12)", fontWeight: 800, fontSize: 12 },
  source: { color: "#58766a", fontSize: 11, marginRight: "auto" },
};
