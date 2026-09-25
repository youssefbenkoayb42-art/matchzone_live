const BASE_URL = "https://matchzone-live.vercel.app";
import TeamFavorite from "./TeamFavorite";

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

function EventCard({ event, featured = false }) {
  const home = event?.strHomeTeam || "الفريق المضيف";
  const away = event?.strAwayTeam || "الفريق الضيف";
  const homeScore = event?.intHomeScore ?? "-";
  const awayScore = event?.intAwayScore ?? "-";
  const time = event?.strTime || event?.strTimestamp || "";
  const date = event?.dateEvent || "";
  const finished = event?.intHomeScore != null && event?.intAwayScore != null;

  return (
    <a href={`/matches/${event.idEvent}`} style={{ ...styles.card, ...(featured ? styles.featuredCard : {}) }}>
      <div style={styles.competition}>
        <span>{event?.strLeague || "مباراة"}</span>
        <span>{finished ? "FT" : "موعد المباراة"}</span>
      </div>
      <div style={styles.teamsRow}>
        <div style={styles.teamBlock}>
          {event?.strHomeTeamBadge ? <img src={event.strHomeTeamBadge} alt="" style={styles.eventLogo} /> : <div style={styles.eventFallback}>FC</div>}
          <strong style={styles.teamName}>{home}</strong>
        </div>
        <div style={styles.middle}>
          <strong style={styles.score}>{homeScore} - {awayScore}</strong>
          <span style={styles.time}>{date} {time}</span>
        </div>
        <div style={styles.teamBlock}>
          {event?.strAwayTeamBadge ? <img src={event.strAwayTeamBadge} alt="" style={styles.eventLogo} /> : <div style={styles.eventFallback}>FC</div>}
          <strong style={styles.teamName}>{away}</strong>
        </div>
      </div>
      <div style={styles.details}>عرض تفاصيل المباراة ←</div>
    </a>
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const teamName = decodeURIComponent(slug);
  const team = await getTeam(teamName);
  const displayName = team?.strTeam || teamName;

  return {
    title: `${displayName} | المباريات والنتائج`,
    description: `تابع مباريات ونتائج ${displayName} والمواعيد القادمة وآخر المواجهات على MatchZone.`,
    alternates: {
      canonical: `${BASE_URL}/teams/${encodeURIComponent(teamName)}`,
    },
    openGraph: {
      title: `${displayName} | MatchZone`,
      description: `مباريات ${displayName} القادمة وآخر النتائج.`,
      url: `${BASE_URL}/teams/${encodeURIComponent(teamName)}`,
      images: team?.strTeamBadge ? [{ url: team.strTeamBadge, alt: displayName }] : [],
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
  const teamDisplayName = team?.strTeam || teamName;
  const teamUrl = `${BASE_URL}/teams/${encodeURIComponent(teamName)}`;
  const leagueName = team?.strLeague || "";
  const country = team?.strCountry || "";
  const venue = team?.strStadium || "";
  const founded = team?.intFormedYear || "";
  const leaguePath = team?.idLeague
    ? `/leagues/league-${team.idLeague}`
    : "/leagues";

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
        name: leagueName || "البطولات",
        item: `${BASE_URL}${leaguePath}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: teamDisplayName,
        item: teamUrl,
      },
    ],
  };

  const teamSchema = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: teamDisplayName,
    url: teamUrl,
    sport: "Football",
    logo: team?.strTeamBadge || undefined,
    location: country ? { "@type": "Place", name: country } : undefined,
    foundingDate: founded ? String(founded) : undefined,
    memberOf: leagueName ? { "@type": "SportsOrganization", name: leagueName } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(teamSchema),
        }}
      />

      <main dir="rtl" style={styles.main} className="team-page-shell">
        <div style={styles.container}>
          <nav style={styles.breadcrumb} aria-label="مسار التنقل">
            <a href="/" style={styles.breadcrumbLink}>
              الرئيسية
            </a>
            <span aria-hidden="true">←</span>
            <a href={leaguePath} style={styles.breadcrumbLink}>
              {leagueName || "البطولات"}
            </a>
            <span aria-hidden="true">←</span>
            <span>{teamDisplayName}</span>
          </nav>

          <a href="/" style={styles.link}>
            ← العودة إلى المباريات
          </a>

          <section style={styles.hero} className="team-page-hero">
            {team?.strTeamBadge ? (
              <img
                src={team.strTeamBadge}
                alt={teamDisplayName}
                style={styles.logo}
              />
            ) : (
              <div style={styles.fallback}>FC</div>
            )}

            <div style={styles.heroContent}>
              <h1 style={styles.h1}>{teamDisplayName}</h1>
              <p style={styles.muted}>
                تابع مباريات ونتائج {teamDisplayName} والمواعيد القادمة وآخر
                المواجهات على MatchZone.
              </p>

              {leagueName && (
                <a
                  href={leaguePath}
                  style={styles.leagueLink}
                >
                  {leagueName}
                </a>
              )}

              <TeamFavorite teamName={teamDisplayName} />

              <div style={styles.metaRow}>
                {country && <span><i className="ui-glyph mini-glyph">LOC</i>{country}</span>}
                {venue && <span><i className="ui-glyph mini-glyph">VEN</i>{venue}</span>}
                {founded && <span><i className="ui-glyph mini-glyph">EST</i>تأسس {founded}</span>}
              </div>

              <div style={styles.statGrid}>
                <div style={styles.statBox}><strong>{upcoming.length}</strong><span>قادمة</span></div>
                <div style={styles.statBox}><strong>{recent.length}</strong><span>نتائج</span></div>
                <div style={styles.statBox}><strong>FC</strong><span>MatchZone</span></div>
              </div>
            </div>
          </section>

          <section>
            <h2 style={styles.h2}>أقرب مباراة</h2>

            {upcoming.length > 0 ? (
              <div style={styles.grid}>
                <EventCard event={upcoming[0]} featured />
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

          <nav style={styles.nav} aria-label="روابط MatchZone">
            <a href="/leagues" style={styles.navLink}>
              تصفح البطولات
            </a>
            <a href="/matches/today" style={styles.navLink}>
              مباريات اليوم
            </a>
          </nav>
        </div>
      </main>
    </>
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
  container: {
    maxWidth: 1000,
    margin: "0 auto",
  },
  link: {
    display: "inline-block",
    marginTop: 10,
    color: "#2ecc71",
    textDecoration: "none",
    fontWeight: 800,
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 8,
    color: "#82968d",
    fontSize: 12,
  },
  breadcrumbLink: {
    color: "#2ecc71",
    textDecoration: "none",
    fontWeight: 800,
  },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    marginTop: 24,
    padding: 25,
    borderRadius: 22,
    background: "linear-gradient(145deg,#123326,#0b1712)",
    border: "1px solid #1e3d30",
  },
  heroContent: {
    minWidth: 0,
    flex: 1,
  },
  logo: {
    width: "clamp(70px,18vw,110px)",
    height: "clamp(70px,18vw,110px)",
    objectFit: "contain",
    flexShrink: 0,
  },
  fallback: {
    fontSize: 65,
    flexShrink: 0,
  },
  h1: {
    margin: 0,
    fontSize: "clamp(25px,6vw,40px)",
    overflowWrap: "anywhere",
  },
  h2: {
    margin: "32px 0 14px",
  },
  muted: {
    color: "#82968d",
    lineHeight: 1.7,
  },
  leagueLink: {
    display: "inline-block",
    color: "#2ecc71",
    textDecoration: "none",
    fontWeight: 900,
    marginTop: 3,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    color: "#a9bbb3",
    fontSize: 12,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0,1fr))",
    gap: 8,
    marginTop: 16,
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    padding: "10px 8px",
    borderRadius: 14,
    background: "rgba(255,255,255,.045)",
    border: "1px solid rgba(255,255,255,.06)",
  },
  featuredCard: {
    padding: 20,
    background: "linear-gradient(145deg,rgba(46,204,113,.12),rgba(255,255,255,.035))",
    border: "1px solid rgba(46,204,113,.2)",
  },
  competition: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    color: "#82968d",
    fontSize: 11,
    marginBottom: 16,
  },
  teamsRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: 12,
    alignItems: "center",
    direction: "ltr",
  },
  teamBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  eventLogo: {
    width: 46,
    height: 46,
    objectFit: "contain",
  },
  eventFallback: {
    width: 46,
    height: 46,
    display: "grid",
    placeItems: "center",
    borderRadius: 14,
    background: "#10231b",
    fontSize: 24,
  },
  teamName: {
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  details: {
    marginTop: 15,
    paddingTop: 11,
    borderTop: "1px solid rgba(255,255,255,.06)",
    color: "#2ecc71",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 800,
  },
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
  middle: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    alignItems: "center",
  },
  score: {
    color: "#2ecc71",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  time: {
    color: "#82968d",
    fontSize: 11,
    whiteSpace: "nowrap",
  },
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