export async function generateMetadata({ params }) {
  const team = decodeURIComponent(params.slug);
  return {
    title: team + " - المباريات والنتائج",
    description: "تابع مباريات ونتائج " + team + " ومواعيد المواجهات القادمة عبر MatchZone.",
    alternates: { canonical: "/teams/" + params.slug },
  };
}

async function getTeam(teamName) {
  try {
    const res = await fetch(
      "https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=" + encodeURIComponent(teamName),
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.teams) ? data.teams[0] : null;
  } catch {
    return null;
  }
}

async function getTeamEvents(teamId) {
  const date = new Date().toISOString().slice(0, 10);
  try {
    const res = await fetch(
      "https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=" + date + "&s=Soccer",
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.events || []).filter(
      (event) => String(event.idHomeTeam) === String(teamId) || String(event.idAwayTeam) === String(teamId)
    );
  } catch {
    return [];
  }
}

export default async function TeamPage({ params }) {
  const teamName = decodeURIComponent(params.slug);
  const team = await getTeam(teamName);
  const events = team?.idTeam ? await getTeamEvents(team.idTeam) : [];

  return (
    <main dir="rtl" style={styles.main}>
      <div style={styles.container}>
        <a href="/" style={styles.link}>← العودة إلى المباريات</a>

        <section style={styles.hero}>
          {team?.strTeamBadge ? (
            <img src={team.strTeamBadge} alt={team.strTeam || teamName} style={styles.logo} />
          ) : (
            <div style={styles.fallback}>⚽</div>
          )}
          <div>
            <h1 style={styles.h1}>{team?.strTeam || teamName}</h1>
            <p style={styles.muted}>مباريات ونتائج الفريق في MatchZone</p>
          </div>
        </section>

        <section>
          <h2 style={styles.h2}>معلومات الفريق</h2>
          <p style={styles.text}>
            {team?.strLeague ? "البطولة: " + team.strLeague : "معلومات البطولة ستظهر عند توفرها."}
          </p>

          {events.length > 0 && (
            <>
              <h2 style={styles.h2}>مباريات اليوم</h2>
              <div style={styles.grid}>
                {events.map((event) => (
                  <a key={event.idEvent} href={"/matches/" + event.idEvent} style={styles.card}>
                    <strong>{event.strHomeTeam}</strong>
                    <span style={styles.score}>{event.intHomeScore ?? "-"} - {event.intAwayScore ?? "-"}</span>
                    <strong>{event.strAwayTeam}</strong>
                  </a>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

const styles = {
  main: { minHeight: "100vh", background: "#07100d", color: "#f4f8f6", padding: "30px 18px 60px", fontFamily: "Arial, Helvetica, sans-serif" },
  container: { maxWidth: 1000, margin: "0 auto" },
  link: { color: "#2ecc71", textDecoration: "none", fontWeight: 800 },
  hero: { display: "flex", alignItems: "center", gap: 18, marginTop: 30, padding: 25, borderRadius: 22, background: "linear-gradient(145deg,#123326,#0b1712)", border: "1px solid #1e3d30" },
  logo: { width: "clamp(70px,18vw,110px)", height: "clamp(70px,18vw,110px)", objectFit: "contain" },
  fallback: { fontSize: 65 },
  h1: { margin: 0, fontSize: "clamp(25px,6vw,40px)" },
  h2: { margin: "32px 0 14px" },
  muted: { color: "#82968d" },
  text: { color: "#b8c6bf", lineHeight: 1.8 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 },
  card: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center", textAlign: "center", direction: "ltr", padding: 18, borderRadius: 18, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", color: "#fff", textDecoration: "none" },
  score: { color: "#2ecc71", fontWeight: 900, whiteSpace: "nowrap" },
};
