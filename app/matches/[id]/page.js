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
      <main
      style={{
        minHeight: "100vh",
        background: "#07100d",
        color: "#f4f8f6",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a
          href="/"
          style={{
            display: "inline-block",
            color: "#37e28a",
            textDecoration: "none",
            marginBottom: "30px",
            fontWeight: "700",
          }}
        >
          ← العودة إلى المباريات
        </a>

        {/* معلومات المباراة */}
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
            🏆 {match.league.name}
          </p>

          <p style={{ color: "#82968d", marginBottom: "35px" }}>
            {status}
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
              <img
                src={match.teams.home.logo}
                alt={match.teams.home.name}
                style={{
                  width: "clamp(62px, 20vw, 100px)",
                  height: "clamp(62px, 20vw, 100px)",
                  objectFit: "contain",
                }}
              />

              <h2
                style={{
                  marginTop: "15px",
                  fontSize: "clamp(14px, 4vw, 20px)",
                  lineHeight: "1.3",
                  maxWidth: "110px",
                  overflowWrap: "anywhere",
                }}
              >
                {match.teams.home.name}
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
              <img
                src={match.teams.away.logo}
                alt={match.teams.away.name}
                style={{
                  width: "clamp(62px, 20vw, 100px)",
                  height: "clamp(62px, 20vw, 100px)",
                  objectFit: "contain",
                }}
              />

              <h2
                style={{
                  marginTop: "15px",
                  fontSize: "clamp(14px, 4vw, 20px)",
                  lineHeight: "1.3",
                  maxWidth: "110px",
                  overflowWrap: "anywhere",
                }}
              >
                {match.teams.away.name}
              </h2>
            </div>
          </div>
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
