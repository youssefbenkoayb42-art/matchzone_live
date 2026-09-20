import Link from "next/link";

const LEAGUES = [
  ["premier-league", "الدوري الإنجليزي الممتاز"],
  ["la-liga", "الدوري الإسباني"],
  ["serie-a", "الدوري الإيطالي"],
  ["bundesliga", "الدوري الألماني"],
  ["ligue-1", "الدوري الفرنسي"],
];

export const metadata = {
  title: "البطولات",
  description: "تصفح أهم بطولات كرة القدم ومباريات اليوم والنتائج والمباريات القادمة.",
};

export default function LeaguesPage() {
  return (
    <main style={styles.main} dir="rtl">
      <div style={styles.container}>
        <Link href="/" style={styles.back}>← العودة للرئيسية</Link>

        <header style={styles.header}>
          <div style={styles.icon}>🏆</div>
          <div>
            <h1 style={styles.h1}>أهم بطولات كرة القدم</h1>
            <p style={styles.muted}>مباريات اليوم، النتائج والمباريات القادمة لأشهر الدوريات.</p>
          </div>
        </header>

        <section style={styles.grid}>
          {LEAGUES.map(([slug, name]) => (
            <Link key={slug} href={"/leagues/" + slug} style={styles.card}>
              <span style={styles.cardIcon}>🏆</span>
              <span style={styles.cardName}>{name}</span>
              <span style={styles.cardText}>مباريات ونتائج ومواعيد البطولة</span>
              <span style={styles.cardLink}>عرض البطولة ←</span>
            </Link>
          ))}
        </section>

        <nav style={styles.nav}>
          <Link href="/matches/today" style={styles.navLink}>🗓️ مباريات اليوم</Link>
          <Link href="/" style={styles.navLink}>⚽ MatchZone</Link>
        </nav>
      </div>
    </main>
  );
}

const styles = {
  main: { minHeight: "100vh", background: "#07100d", color: "#f4f8f6", padding: "30px 18px 60px", fontFamily: "Arial, Helvetica, sans-serif" },
  container: { maxWidth: 1100, margin: "0 auto" },
  back: { color: "#2ecc71", textDecoration: "none", fontWeight: 800 },
  header: { display: "flex", alignItems: "center", gap: 15, marginTop: 25, padding: "25px 20px", borderRadius: 22, background: "linear-gradient(145deg,#123326,#0b1712)", border: "1px solid #1e3d30" },
  icon: { fontSize: 40 },
  h1: { margin: 0, fontSize: "clamp(25px,5vw,40px)" },
  muted: { color: "#82968d", margin: "8px 0 0", lineHeight: 1.7 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 15, marginTop: 25 },
  card: { display: "flex", flexDirection: "column", gap: 10, padding: 20, borderRadius: 20, background: "linear-gradient(145deg,#10251c,#0b1713)", border: "1px solid #1e3d30", color: "#f4f8f6", textDecoration: "none" },
  cardIcon: { fontSize: 28 },
  cardName: { fontSize: 18, fontWeight: 900 },
  cardText: { color: "#82968d", fontSize: 13 },
  cardLink: { color: "#2ecc71", fontWeight: 800, fontSize: 12, marginTop: 6 },
  nav: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 30 },
  navLink: { color: "#2ecc71", textDecoration: "none", padding: "10px 14px", borderRadius: 12, background: "rgba(46,204,113,.07)", border: "1px solid rgba(46,204,113,.12)", fontWeight: 800 },
};
