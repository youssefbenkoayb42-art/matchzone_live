import Link from "next/link";

const LEAGUES = [
  ["premier-league", "الدوري الإنجليزي الممتاز", "Premier League", "/leagues/premier-league.svg"],
  ["la-liga", "الدوري الإسباني", "LaLiga", "/leagues/la-liga.svg"],
  ["serie-a", "الدوري الإيطالي", "Serie A", "/leagues/serie-a.svg"],
  ["bundesliga", "الدوري الألماني", "Bundesliga", "/leagues/bundesliga.svg"],
  ["ligue-1", "الدوري الفرنسي", "Ligue 1", "/leagues/ligue-1.svg"],
];



const FEATURED_SLUGS = new Set(LEAGUES.map(([slug]) => slug));

function slugifyLeague(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getAvailableLeagues() {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });

  try {
    const responses = await Promise.all(
      days.map(async (date) => {
        const response = await fetch(
          "https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=" + date + "&s=Soccer",
          { next: { revalidate: 900 } }
        );
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data?.events) ? data.events : [];
      })
    );

    const map = new Map();
    responses.flat().forEach((event) => {
      const name = event?.strLeague;
      if (!name) return;
      const id = String(event.idLeague || "");
      const key = id || name;
      const current = map.get(key) || {
        id,
        name,
        country: event.strCountry || "",
        logo: event.strLeagueBadge || null,
        matches: 0,
      };
      current.matches += 1;
      if (!current.logo && event.strLeagueBadge) current.logo = event.strLeagueBadge;
      if (!current.country && event.strCountry) current.country = event.strCountry;
      map.set(key, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.matches - a.matches || a.name.localeCompare(b.name))
      .slice(0, 24);
  } catch {
    return [];
  }
}

export const metadata = {
  title: "أهم بطولات كرة القدم",
  description: "تصفح أهم بطولات كرة القدم مع الشعارات الرسمية والهوية البصرية لكل دوري، ومتابعة المباريات والنتائج والمواعيد.",
  alternates: { canonical: "https://matchzone-live.vercel.app/leagues" },
};

async function AvailableLeagues() {
  const leagues = await getAvailableLeagues();

  if (!leagues.length) {
    return <div style={styles.empty}>تعذر اكتشاف بطولات إضافية من المصدر المجاني حالياً.</div>;
  }

  return (
    <div style={styles.discoveredGrid}>
      {leagues.map((league) => {
        const featured = Array.from(FEATURED_SLUGS).find((slug) => {
          const item = LEAGUES.find(([value]) => value === slug);
          return item && (item[2].toLowerCase() === league.name.toLowerCase());
        });
        const content = (
          <>
            <div style={styles.discoveredLogo}>
              {league.logo ? <img src={league.logo} alt="" style={styles.discoveredLogoImg} /> : "🏆"}
            </div>
            <div style={styles.discoveredBody}>
              <strong>{league.name}</strong>
              <span>{league.country || "كرة القدم"}</span>
              <small>{league.matches} مباراة في نافذة البيانات الحالية</small>
            </div>
          </>
        );

        return featured ? (
          <Link key={league.id || league.name} href={"/leagues/" + featured} style={styles.discoveredCard}>{content}</Link>
        ) : (
          <div key={league.id || league.name} style={styles.discoveredCard}>{content}</div>
        );
      })}
    </div>
  );
}

export default function LeaguesPage() {
  return (
    <main style={styles.main} dir="rtl">
      <div style={styles.container}>
        <Link href="/" style={styles.back}>← العودة للرئيسية</Link>

        <header style={styles.header}>
          <div style={styles.headerBadge}><span style={styles.headerMark}>⚽</span></div>
          <div>
            <span style={styles.eyebrow}>MATCHZONE • LEAGUES</span>
            <h1 style={styles.h1}>أهم بطولات كرة القدم</h1>
            <p style={styles.muted}>شعارات وهوية بصرية مميزة لكل دوري، مع المباريات والنتائج والمواعيد.</p>
          </div>
        </header>

        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <span style={styles.sectionKicker}>TOP COMPETITIONS</span>
              <h2 style={styles.sectionTitle}>الدوريات الكبرى</h2>
            </div>
            <span style={styles.count}>{LEAGUES.length} بطولات</span>
          </div>

          <div style={styles.grid}>
            {LEAGUES.map(([slug, name, englishName, logo]) => (
              <div key={slug} style={styles.card}>
                <Link href={"/leagues/" + slug} style={styles.cardMain}>
                  <div style={styles.logoWrap}>
                    <img src={logo} alt={name + " شعار"} style={styles.logo} />
                  </div>
                  <div style={styles.cardBody}>
                    <span style={styles.englishName}>{englishName}</span>
                    <span style={styles.cardName}>{name}</span>
                    <span style={styles.cardText}>مباريات ونتائج ومواعيد البطولة</span>
                  </div>
                </Link>
                <Link href={"/standings/" + slug} style={styles.standingsLink}>📊 جدول الترتيب <span>←</span></Link>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <span style={styles.sectionKicker}>FREE COVERAGE</span>
              <h2 style={styles.sectionTitle}>بطولات تظهر في بيانات المباريات</h2>
            </div>
            <span style={styles.count}>7 أيام</span>
          </div>
          <AvailableLeagues />
        </section>

        <nav style={styles.nav}>
          <Link href="/matches/today" style={styles.navLink}>🗓️ مباريات اليوم</Link>
          <Link href="/standings/premier-league" style={styles.navLink}>📊 ترتيب الدوريات</Link>
          <Link href="/" style={styles.navLink}>⚽ MatchZone</Link>
        </nav>
      </div>
    </main>
  );
}

const styles = {
  main: { minHeight: "100vh", background: "radial-gradient(circle at 50% -10%, rgba(46,204,113,.13), transparent 38%), #07100d", color: "#f4f8f6", padding: "28px 18px 70px", fontFamily: "Arial, Helvetica, sans-serif" },
  container: { maxWidth: 1100, margin: "0 auto" },
  back: { color: "#2ecc71", textDecoration: "none", fontWeight: 800, fontSize: 14 },
  header: { display: "flex", alignItems: "center", gap: 18, marginTop: 22, padding: "28px 24px", borderRadius: 26, background: "linear-gradient(145deg,#123326,#0b1712)", border: "1px solid #1e3d30", boxShadow: "0 18px 50px rgba(0,0,0,.22)" },
  headerBadge: { width: 64, height: 64, minWidth: 64, borderRadius: 20, display: "grid", placeItems: "center", background: "rgba(46,204,113,.10)", border: "1px solid rgba(46,204,113,.22)" },
  headerMark: { fontSize: 31 },
  eyebrow: { display: "block", color: "#2ecc71", fontSize: 10, fontWeight: 900, letterSpacing: 1.5, marginBottom: 5 },
  h1: { margin: 0, fontSize: "clamp(25px,5vw,40px)", lineHeight: 1.2 },
  muted: { color: "#82968d", margin: "9px 0 0", lineHeight: 1.8, fontSize: 14 },
  section: { marginTop: 30 },
  sectionHead: { display: "flex", alignItems: "end", justifyContent: "space-between", gap: 15, marginBottom: 15 },
  sectionKicker: { color: "#58766a", fontSize: 10, fontWeight: 900, letterSpacing: 1.4 },
  sectionTitle: { margin: "4px 0 0", fontSize: 23 },
  count: { color: "#2ecc71", fontSize: 12, fontWeight: 900, padding: "8px 11px", borderRadius: 10, background: "rgba(46,204,113,.07)", border: "1px solid rgba(46,204,113,.13)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 },
  card: { minHeight: 260, display: "flex", flexDirection: "column", padding: 18, borderRadius: 24, background: "linear-gradient(145deg,#10251c,#0a1511)", border: "1px solid #1e3d30", color: "#f4f8f6", boxShadow: "0 12px 35px rgba(0,0,0,.16)" },
  cardMain: { display: "flex", flexDirection: "column", flex: 1, color: "#f4f8f6", textDecoration: "none" },
  logoWrap: { height: 122, borderRadius: 19, display: "grid", placeItems: "center", background: "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015))", border: "1px solid rgba(255,255,255,.07)", marginBottom: 16 },
  logo: { width: 82, height: 82, objectFit: "contain", display: "block" },
  cardBody: { display: "flex", flexDirection: "column", gap: 5, flex: 1 },
  englishName: { color: "#58766a", fontSize: 10, fontWeight: 900, letterSpacing: 1.1, textTransform: "uppercase" },
  cardName: { fontSize: 18, fontWeight: 900 },
  cardText: { color: "#82968d", fontSize: 12, lineHeight: 1.7 },
  standingsLink: { display: "flex", justifyContent: "space-between", alignItems: "center", color: "#2ecc71", textDecoration: "none", fontWeight: 900, fontSize: 12, marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.06)" },
  nav: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 30 },
  navLink: { color: "#2ecc71", textDecoration: "none", padding: "10px 14px", borderRadius: 12, background: "rgba(46,204,113,.07)", border: "1px solid rgba(46,204,113,.12)", fontWeight: 800 },
  discoveredGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 },
  discoveredCard: { display: "flex", alignItems: "center", gap: 13, minHeight: 96, padding: 14, borderRadius: 18, background: "linear-gradient(145deg,#10251c,#0a1511)", border: "1px solid #1e3d30", color: "#f4f8f6", textDecoration: "none" },
  discoveredLogo: { width: 52, height: 52, minWidth: 52, borderRadius: 14, display: "grid", placeItems: "center", background: "#fff", overflow: "hidden", fontSize: 23 },
  discoveredLogoImg: { width: "82%", height: "82%", objectFit: "contain" },
  discoveredBody: { minWidth: 0, display: "flex", flexDirection: "column", gap: 3 },
  discoveredBodyStrong: { fontSize: 14 },
  discoveredBodySpan: { color: "#71847b", fontSize: 10 },
  discoveredBodySmall: { color: "#2ecc71", fontSize: 9, fontWeight: 800 },
  empty: { padding: 28, borderRadius: 18, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", color: "#82968d", textAlign: "center" },
};
