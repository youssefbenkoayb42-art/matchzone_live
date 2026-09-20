const BASE_URL = "https://matchzone-live.vercel.app";

async function getTeam(teamName) {
  try {
    const res = await fetch(
      "https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=" +
        encodeURIComponent(teamName),
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.teams) ? data.teams[0] : null;
  } catch {
    return null;
  }
}

async function getTeamEvents(teamId, endpoint) {
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/${endpoint}?id=${encodeURIComponent(teamId)}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.events) ? data.events : [];
  } catch {
    return [];
  }
}

function EventCard({ event }) {
  const home = event?.strHomeTeam || "الفريق المضيف";
  const away = event?.strAwayTeam || "الفريق الضيف";
  const homeScore = event?.intHomeScore ?? "-";
  const awayScore = event?.intAwayScore ?? "-";
  const time = event?.strTime || event?.strTimestamp || "";

  return (
    <a href={`/matches/${event.idEvent}`} style={styles.card}>
      <div style={styles.team}>{home}</div>
      <div style={styles.middle}>
        <strong style={styles.score}>{homeScore} - {awayScore}</strong>
        <span style={styles.time}>{time}</span>
      </div>
      <div style={styles.team}>{away}</div>
    </a>
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const teamName = decodeURIComponent(slug);

  return {
    title: `${teamName} | المباريات والنتائج`,
    description: `تابع مباريات ونتائج ${teamName} والمواعيد القادمة وآخر المواجهات على MatchZone.`,
    alternates: {
      canonical: `${BASE_URL}/teams/${encodeURIComponent(teamName)}`,
    },
  };
}

export default async function TeamPage({ params }) {
  const { slug } = await params;
  const teamName = decodeURIComponent(slug);
  const team = await getTeam(teamName);

  const [nextEvents, lastEvents] = team?.idTeam
    ? await Promise.all([
        getTeamEvents(team.idTeam, "eventsnext"),
        getTeamEvents(team.idTeam, "eventslast"),
      ])
    : [[], []];

  const upcoming = nextEvents.slice(0, 5);
  const recent = lastEvents.slice(0, 5);

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "الرئيسية",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "الفريق",
        item: `${BASE_URL}/teams/${encodeURIComponent(teamName)}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <main dir="rtl" style={styles.main}>
      <div style={styles.container}>
        <a href="/" style={styles.link}>← العودة إلى المباريات</a>

        <section style={styles.hero}>
          {team?.strTeamBadge ? (
            <img
              src={team.strTeamBadge}
              alt={team.strTeam || teamName}
              style={styles.logo}
            />
          ) : (
            <div style={styles.fallback}>⚽</div>
          )}
          <div>
            <h1 style={styles.h1}>{team?.strTeam || teamName}</h1>
            <p style={styles.muted}>
              مباريات ونتائج {team?.strTeam || teamName} على MatchZone
            </p>
            {team?.strLeague && (
              <p style={styles.league}>🏆 {team.strLeague}</p>
            )}
          </div>
        </section>

        <section>
          <h2 style={styles.h2}>أقرب مباراة</h2>
          {upcoming.length > 0 ? (
            <div style={styles.grid}>
              <EventCard event={upcoming[0]} />
            </div>
          ) : (
            <p style={styles.empty}>لا توجد مباراة قادمة متاحة حاليًا.</p>
          )}

          <h2 style={styles.h2}>باقي المباريات القادمة</h2>
          {upcoming.length > 1 ? (
            <div style={styles.grid}>
              {upcoming.slice(1).map((event) => (
                <EventCard key={event.idEvent} event={event} />
              ))}
            </div>
          ) : (
            <p style={styles.empty}>
              {upcoming.length === 1
                ? "لا توجد مباريات أخرى مجدولة حاليًا."
                : "لا توجد مواعيد قادمة متاحة حاليًا."}
            </p>
          )}

          <h2 style={styles.h2}>آخر النتائج</h2>
          {recent.length > 0 ? (
            <div style={styles.grid}>
              {recent.map((event) => (
                <EventCard key={event.idEvent} event={event} />
              ))}
            </div>
          ) : (
            <p style={styles.empty}>لا توجد نتائج سابقة متاحة حاليًا.</p>
          )}
        </section>

        <nav style={styles.nav}>
          <a href="/leagues" style={styles.navLink}>تصفح البطولات</a>
          <a href="/matches/today" style={styles.navLink}>مباريات اليوم</a>
        </nav>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#07100d",
    color: "#f4f8f6",
    padding: "30px 18px 60px",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  container: { maxWidth: 1000, margin: "0 auto" },
  link: { color: "#2ecc71", textDecoration: "none", fontWeight: 800 },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    marginTop: 30,
    padding: 25,
    borderRadius: 22,
    background: "linear-gradient(145deg,#123326,#0b1712)",
    border: "1px solid #1e3d30",
  },
  logo: {
    width: "clamp(70px,18vw,110px)",
    height: "clamp(70px,18vw,110px)",
    objectFit: "contain",
  },
  fallback: { fontSize: 65 },
  h1: { margin: 0, fontSize: "clamp(25px,6vw,40px)" },
  h2: { margin: "32px 0 14px" },
  muted: { color: "#82968d", lineHeight: 1.7 },
  league: { color: "#2ecc71", fontWeight: 800, marginBottom: 0 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
    gap: 12,
  },
  card: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: 10,
    alignItems: "center",
    textAlign: "center",
    direction: "ltr",
    padding: 18,
    borderRadius: 18,
    background: "rgba(255,255,255,.035)",
    border: "1px solid rgba(255,255,255,.07)",
    color: "#fff",
    textDecoration: "none",
  },
  team: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 800,
  },
  middle: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    alignItems: "center",
  },
  score: { color: "#2ecc71", fontWeight: 900, whiteSpace: "nowrap" },
  time: { color: "#82968d", fontSize: 11, whiteSpace: "nowrap" },
  empty: {
    color: "#82968d",
    padding: "18px",
    borderRadius: 16,
    background: "rgba(255,255,255,.025)",
  },
  nav: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 35,
  },
  navLink: {
    color: "#2ecc71",
    textDecoration: "none",
    padding: "11px 15px",
    borderRadius: 12,
    background: "rgba(46,204,113,.07)",
    border: "1px solid rgba(46,204,113,.12)",
    fontWeight: 800,
  },
};