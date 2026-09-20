const BASE_URL = "https://matchzone-live.vercel.app";

async function getMatch(id) {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/lookupevent.php?id=${encodeURIComponent(id)}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const event = data.events?.[0];
    if (!event) return null;

    return {
      fixture: {
        id: Number(event.idEvent),
        date: event.strTimestamp || `${event.dateEvent}T${event.strTime || "00:00:00"}`,
        status: { short: event.strStatus || "NS" },
        venue: { name: event.strVenue || null },
      },
      league: {
        id: Number(event.idLeague),
        name: event.strLeague || "كرة القدم",
      },
      teams: {
        home: {
          id: Number(event.idHomeTeam),
          name: event.strHomeTeam || "الفريق المضيف",
          logo: event.strHomeTeamBadge || null,
        },
        away: {
          id: Number(event.idAwayTeam),
          name: event.strAwayTeam || "الفريق الضيف",
          logo: event.strAwayTeamBadge || null,
        },
      },
      goals: {
        home: event.intHomeScore !== null && event.intHomeScore !== undefined ? Number(event.intHomeScore) : null,
        away: event.intAwayScore !== null && event.intAwayScore !== undefined ? Number(event.intAwayScore) : null,
      },
      video: event.strVideo || null,
      eventId: event.idEvent,
    };
  } catch {
    return null;
  }
}

export default async function MatchPage({ params }) {
  const { id } = await params;
  const match = await getMatch(id);

  if (!match) {
    return (
      <main style={{ minHeight: "100vh", background: "#07100d", color: "#f4f8f6", padding: "40px 20px", textAlign: "center" }} dir="rtl">
        <h1>لم يتم العثور على المباراة</h1>
        <a href="/" style={{ color: "#37e28a", textDecoration: "none", fontWeight: "700" }}>← العودة إلى المباريات</a>
      </main>
    );
  }

  const matchStatus = match.fixture.status.short;

  const leagueSlug =
    match.league.id === 4328 ? "premier-league" :
    match.league.id === 4335 ? "la-liga" :
    match.league.id === 4332 ? "serie-a" :
    match.league.id === 4331 ? "bundesliga" :
    match.league.id === 4334 ? "ligue-1" : null;

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: match.league.name,
        item: leagueSlug ? BASE_URL + "/leagues/" + leagueSlug : BASE_URL + "/leagues",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: match.teams.home.name + " ضد " + match.teams.away.name,
        item: BASE_URL + "/matches/" + id,
      },
    ],
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${match.teams.home.name} vs ${match.teams.away.name}`,
    description: `مباراة ${match.teams.home.name} ضد ${match.teams.away.name} في ${match.league.name}`,
    startDate: match.fixture.date,
    url: `${BASE_URL}/matches/${id}`,
    homeTeam: {
      "@type": "SportsTeam",
      name: match.teams.home.name,
    },
    awayTeam: {
      "@type": "SportsTeam",
      name: match.teams.away.name,
    },
    sport: "Football",
    eventStatus:
      matchStatus === "FT"
        ? "https://schema.org/EventCompleted"
        : "https://schema.org/EventScheduled",
    location: match.fixture.venue?.name
      ? {
          "@type": "Place",
          name: match.fixture.venue.name,
        }
      : undefined,
  };

  const isLive = ["1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(
    matchStatus
  );

  const status =
    matchStatus === "FT"
      ? "انتهت المباراة"
      : isLive
      ? "🔴 مباشر الآن"
      : "لم تبدأ";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <main
      style={{
        minHeight: "100vh",
        background: "#07100d",
        color: "#f4f8f6",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "22px",
          }}
        >
          <a
            href="/"
            style={{
              display: "inline-block",
              color: "#37e28a",
              textDecoration: "none",
              fontWeight: "700",
            }}
          >
            ← مباريات اليوم
          </a>
          <span
            style={{
              color: "#82968d",
              fontSize: "13px",
              border: "1px solid #284238",
              borderRadius: "999px",
              padding: "7px 12px",
              background: "#0b1713",
            }}
          >
            MatchZone • تفاصيل المباراة
          </span>
        </div>

        {/* معلومات المباراة */}
        <nav
          aria-label="مسار التنقل"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
            marginBottom: "18px",
            color: "#82968d",
            fontSize: "14px",
          }}
        >
          <a href="/" style={{ color: "#37e28a", textDecoration: "none" }}>الرئيسية</a>
          <span>←</span>
          <a
            href={`/leagues/${match.league.id === 4328 ? "premier-league" : match.league.id === 4335 ? "la-liga" : match.league.id === 4332 ? "serie-a" : match.league.id === 4331 ? "bundesliga" : match.league.id === 4334 ? "ligue-1" : "leagues"}`}
            style={{ color: "#37e28a", textDecoration: "none" }}
          >
            {match.league.name}
          </a>
          <span>←</span>
          <span>{match.teams.home.name} ضد {match.teams.away.name}</span>
        </nav>

        <div
          style={{
            background: "linear-gradient(145deg, #10251c, #0b1713)",
            border: "1px solid #284238",
            borderRadius: "25px",
            padding: "35px 20px",
            textAlign: "center",
            boxShadow: "0 25px 80px #0008",
          }}
        >
          <p
            style={{
              color: "#37e28a",
              fontWeight: "700",
              marginBottom: "10px",
            }}
          >
            🏆{" "}
            <a
              href={`/leagues/${match.league.id === 4328 ? "premier-league" : match.league.id === 4335 ? "la-liga" : match.league.id === 4332 ? "serie-a" : match.league.id === 4331 ? "bundesliga" : match.league.id === 4334 ? "ligue-1" : "leagues"}`}
              style={{ color: "#37e28a", textDecoration: "none" }}
            >
              {match.league.name}
            </a>
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: isLive ? "#ff6b6b" : "#82968d",
              background: isLive ? "#35191b" : "#0b1713",
              border: "1px solid #284238",
              borderRadius: "999px",
              padding: "8px 14px",
              marginBottom: "28px",
              fontWeight: "800",
            }}
          >
            <span aria-hidden="true">{isLive ? "●" : "•"}</span>
            {status}
          </div>

          <p style={{ color: "#82968d", margin: "0 0 28px" }}>
            {new Date(match.fixture.date).toLocaleDateString("ar-MA", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "15px",
              flexWrap: "nowrap",
              direction: "ltr",
              width: "100%",
              overflow: "hidden",
            }}
          >
            {/* الفريق المضيف */}
            <div style={{ direction: "rtl", minWidth: 0, textAlign: "center" }}>
              <div
                style={{
                  width: "clamp(70px, 22vw, 110px)",
                  height: "clamp(70px, 22vw, 110px)",
                  margin: "0 auto",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "24px",
                  background: "#07100d",
                  border: "1px solid #284238",
                }}
              >
                {match.teams.home.logo ? (
                  <img
                    src={match.teams.home.logo}
                    alt={match.teams.home.name}
                    style={{
                      width: "80%",
                      height: "80%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "34px" }} aria-hidden="true">⚽</span>
                )}
              </div>

              <h2
                style={{
                  marginTop: "15px",
                  fontSize: "clamp(14px, 4vw, 20px)",
                  lineHeight: "1.3",
                  maxWidth: "110px",
                  overflowWrap: "anywhere",
                }}
              >
                <a href={`/teams/${encodeURIComponent(match.teams.home.name)}`} style={{ color: "inherit", textDecoration: "none" }}>{match.teams.home.name}</a>
              </h2>
            </div>

            {/* النتيجة */}
            <div>
              <div
                style={{
                  fontSize: "clamp(30px, 8vw, 42px)",
                  fontWeight: "900",
                  color: "#37e28a",
                  direction: "ltr",
                  whiteSpace: "nowrap",
                  minWidth: "85px",
                }}
              >
                <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    minWidth: "110px",
  }}
>
  <span>{match.goals.home ?? 0}</span>
  <span>-</span>
  <span>{match.goals.away ?? 0}</span>
</div>
              </div>

              <p style={{ color: "#82968d", marginTop: "10px" }}>
                {new Date(match.fixture.date).toLocaleTimeString("ar-MA", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* الفريق الضيف */}
            <div style={{ direction: "rtl", minWidth: 0, textAlign: "center" }}>
              <div
                style={{
                  width: "clamp(70px, 22vw, 110px)",
                  height: "clamp(70px, 22vw, 110px)",
                  margin: "0 auto",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "24px",
                  background: "#07100d",
                  border: "1px solid #284238",
                }}
              >
                {match.teams.away.logo ? (
                  <img
                    src={match.teams.away.logo}
                    alt={match.teams.away.name}
                    style={{
                      width: "80%",
                      height: "80%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "34px" }} aria-hidden="true">⚽</span>
                )}
              </div>

              <h2
                style={{
                  marginTop: "15px",
                  fontSize: "clamp(14px, 4vw, 20px)",
                  lineHeight: "1.3",
                  maxWidth: "110px",
                  overflowWrap: "anywhere",
                }}
              >
                <a href={`/teams/${encodeURIComponent(match.teams.away.name)}`} style={{ color: "inherit", textDecoration: "none" }}>{match.teams.away.name}</a>
              </h2>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "12px",
          }}
        >
          <a
            href={`/teams/${encodeURIComponent(match.teams.home.name)}`}
            style={{
              textDecoration: "none",
              color: "#f4f8f6",
              background: "#0b1713",
              border: "1px solid #284238",
              borderRadius: "16px",
              padding: "14px",
              textAlign: "center",
              fontWeight: "700",
            }}
          >
            📊 صفحة {match.teams.home.name}
          </a>
          <a
            href={`/teams/${encodeURIComponent(match.teams.away.name)}`}
            style={{
              textDecoration: "none",
              color: "#f4f8f6",
              background: "#0b1713",
              border: "1px solid #284238",
              borderRadius: "16px",
              padding: "14px",
              textAlign: "center",
              fontWeight: "700",
            }}
          >
            📊 صفحة {match.teams.away.name}
          </a>
        </div>

        {/* الفيديو */}
        {match.video && (
          <div
            style={{
              marginTop: "30px",
              background: "linear-gradient(145deg, #10251c, #0b1713)",
              border: "1px solid #284238",
              borderRadius: "25px",
              padding: "25px 20px",
              boxShadow: "0 20px 60px #0006",
            }}
          >
            <h2
              style={{
                color: "#37e28a",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              🎬 أبرز أحداث المباراة
            </h2>

            <div
              style={{
                position: "relative",
                width: "100%",
                paddingBottom: "56.25%",
                overflow: "hidden",
                borderRadius: "18px",
              }}
            >
              <iframe
                src={match.video.replace("watch?v=", "embed/")}
                title="Match Highlights"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>
          </div>
        )}

        {/* معلومات إضافية */}
        {(match.fixture.venue?.name || match.eventId) && (
          <div
            style={{
              marginTop: "30px",
              background: "linear-gradient(145deg, #10251c, #0b1713)",
              border: "1px solid #284238",
              borderRadius: "25px",
              padding: "25px 20px",
              textAlign: "center",
            }}
          >
            {match.fixture.venue?.name && (
              <p style={{ color: "#c5d2cc", margin: "8px" }}>
                🏟️ الملعب:{" "}
                <strong>{match.fixture.venue.name}</strong>
              </p>
            )}

            <p style={{ color: "#82968d", margin: "8px" }}>
              🆔 رقم المباراة: {match.eventId}
            </p>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
