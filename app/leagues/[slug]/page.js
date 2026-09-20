const LEAGUES = {
  "premier-league": { id: 4328, name: "الدوري الإنجليزي الممتاز", english: "Premier League", description: "مباريات ونتائج الدوري الإنجليزي الممتاز اليوم ومواعيد أهم المواجهات." },
  "la-liga": { id: 4335, name: "الدوري الإسباني", english: "La Liga", description: "مباريات ونتائج الدوري الإسباني اليوم ومواعيد أهم المواجهات." },
  "serie-a": { id: 4332, name: "الدوري الإيطالي", english: "Serie A", description: "مباريات ونتائج الدوري الإيطالي اليوم ومواعيد أهم المواجهات." },
  "bundesliga": { id: 4331, name: "الدوري الألماني", english: "Bundesliga", description: "مباريات ونتائج الدوري الألماني اليوم ومواعيد أهم المواجهات." },
  "ligue-1": { id: 4334, name: "الدوري الفرنسي", english: "Ligue 1", description: "مباريات ونتائج الدوري الفرنسي اليوم ومواعيد أهم المواجهات." },
};

export async function generateMetadata({ params }) {
  const league = LEAGUES[params.slug];
  if (!league) return { title: "البطولة غير موجودة" };
  return {
    title: league.name + " - مباريات ونتائج اليوم",
    description: league.description,
    alternates: { canonical: "/leagues/" + params.slug },
  };
}

async function getMatches(leagueId) {
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

export default async function LeaguePage({ params }) {
  const league = LEAGUES[params.slug];

  if (!league) {
    return <main style={styles.main}><h1>البطولة غير موجودة</h1><a href="/leagues" style={styles.link}>العودة إلى البطولات</a></main>;
  }

  const matches = await getMatches(league.id);

  return (
    <main style={styles.main} dir="rtl">
      <div style={styles.container}>
        <a href="/leagues" style={styles.link}>← كل البطولات</a>

        <header style={styles.header}>
          <span style={{ fontSize: 38 }}>🏆</span>
          <div>
            <h1 style={styles.h1}>{league.name}</h1>
            <p style={styles.muted}>مباريات اليوم ونتائج {league.name}</p>
          </div>
        </header>

        <p style={styles.description}>{league.description}</p>

        <section>
          <h2 style={styles.h2}>مباريات {league.name} اليوم</h2>

          {matches.length === 0 ? (
            <div style={styles.empty}>لا توجد مباريات مسجلة لهذه البطولة اليوم.</div>
          ) : (
            <div style={styles.grid}>
              {matches.map((match) => (
                <article key={match.idEvent} style={styles.card}>
                  <div style={styles.competition}>{league.english}</div>
                  <div style={styles.teams}>
                    <div><strong>{match.strHomeTeam}</strong><small>المضيف</small></div>
                    <div style={styles.score}>{match.intHomeScore ?? "-"} - {match.intAwayScore ?? "-"}</div>
                    <div><strong>{match.strAwayTeam}</strong><small>الضيف</small></div>
                  </div>
                  <div style={styles.meta}>{match.dateEvent || ""} {match.strTime ? "• " + match.strTime : ""}</div>
                  <a href={"/matches/" + match.idEvent} style={styles.button}>تفاصيل المباراة</a>
                </article>
              ))}
            </div>
          )}
        </section>

        <nav style={styles.nav}>
          {Object.entries(LEAGUES).filter(([slug]) => slug !== params.slug).map(([slug, item]) => (
            <a key={slug} href={"/leagues/" + slug} style={styles.navLink}>{item.name}</a>
          ))}
        </nav>
      </div>
    </main>
  );
}

const styles = {
  main: { minHeight: "100vh", background: "#07100d", color: "#f4f8f6", padding: "30px 18px 60px", fontFamily: "Arial, Helvetica, sans-serif" },
  container: { maxWidth: 1100, margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: 15, marginTop: 30, padding: "25px 20px", borderRadius: 22, background: "linear-gradient(145deg,#123326,#0b1712)", border: "1px solid #1e3d30" },
  h1: { margin: 0, fontSize: "clamp(24px,5vw,38px)" },
  h2: { margin: "35px 0 18px", fontSize: 22 },
  muted: { color: "#82968d", margin: "8px 0 0" },
  description: { color: "#b8c6bf", lineHeight: 1.8, marginTop: 22 },
  link: { color: "#2ecc71", textDecoration: "none", fontWeight: 800 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 15 },
  card: { background: "linear-gradient(145deg,#10251c,#0b1713)", border: "1px solid #1e3d30", borderRadius: 20, padding: 18 },
  competition: { color: "#2ecc71", fontSize: 12, fontWeight: 800, marginBottom: 20 },
  teams: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", textAlign: "center", direction: "ltr" },
  score: { fontSize: 22, fontWeight: 900, whiteSpace: "nowrap" },
  meta: { color: "#718078", fontSize: 11, textAlign: "center", margin: "18px 0" },
  button: { display: "block", textAlign: "center", background: "rgba(46,204,113,.08)", border: "1px solid rgba(46,204,113,.14)", color: "#2ecc71", padding: 11, borderRadius: 11, textDecoration: "none", fontWeight: 800, fontSize: 12 },
  empty: { padding: 35, borderRadius: 18, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", color: "#82968d", textAlign: "center" },
  nav: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 35 },
  navLink: { color: "#b8c6bf", textDecoration: "none", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,.04)" },
};
