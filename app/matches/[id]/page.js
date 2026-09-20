import LiveMatchRefresh from "./LiveMatchRefresh";

const BASE_URL = "https://matchzone-live.vercel.app";

async function getTeamEvents(teamId, endpoint) {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/${endpoint}?id=${encodeURIComponent(teamId)}`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.events) ? data.events : [];
  } catch {
    return [];
  }
}

async function getMatch(id) {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/lookupevent.php?id=${encodeURIComponent(id)}`,
      { cache: "no-store" }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const event = data.events?.[0];
    if (!event) return null;

    const [statsResponse, lineupResponse, timelineResponse] = await Promise.all([
      fetch(
        `https://www.thesportsdb.com/api/v1/json/123/lookupeventstats.php?id=${encodeURIComponent(id)}`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        `https://www.thesportsdb.com/api/v1/json/123/lookuplineup.php?id=${encodeURIComponent(id)}`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        `https://www.thesportsdb.com/api/v1/json/123/lookuptimeline.php?id=${encodeURIComponent(id)}`,
        { next: { revalidate: 300 } }
      ),
    ]);

    const statsData = statsResponse.ok ? await statsResponse.json() : {};
    const lineupData = lineupResponse.ok ? await lineupResponse.json() : {};
    const timelineData = timelineResponse.ok ? await timelineResponse.json() : {};

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
        season: event.strSeason || null,
        country: event.strCountry || null,
        round: event.intRound || null,
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
      events: {
        homeGoals: event.strHomeGoalDetails || null,
        awayGoals: event.strAwayGoalDetails || null,
        homeYellowCards: event.strHomeYellowCards || null,
        awayYellowCards: event.strAwayYellowCards || null,
        homeRedCards: event.strHomeRedCards || null,
        awayRedCards: event.strAwayRedCards || null,
      },
      stats: Array.isArray(statsData.eventstats)
        ? statsData.eventstats.map((stat) => ({
            name: stat.strStat || "إحصائية",
            home: stat.intHome ?? null,
            away: stat.intAway ?? null,
          }))
        : [],
      lineup: Array.isArray(lineupData.lineup)
        ? lineupData.lineup.map((player) => ({
            name: player.strPlayer || "لاعب",
            position: player.strPosition || null,
            number: player.intSquadNumber || null,
            team: player.strHome === "Yes" ? "home" : "away",
            substitute: player.strSubstitute === "Yes",
            image: player.strCutout || player.strThumb || null,
          }))
        : [],
      timeline: Array.isArray(timelineData.timeline)
        ? timelineData.timeline.map((item) => ({
            time: item.strTime || item.intTime || "",
            type: item.strTimeline || "حدث",
            detail: item.strTimelineDetail || null,
            player: item.strPlayer || null,
            assist: item.strAssist || null,
            team: item.strHome === "Yes" ? "home" : "away",
            substitute: item.strSubstitute || null,
            card: item.strCard || null,
            goal: item.strGoal || null,
          }))
        : [],
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

  const [nextTeamEvents, lastTeamEvents] = match.teams.home.id
    ? await Promise.all([
        getTeamEvents(match.teams.home.id, "eventsnext"),
        getTeamEvents(match.teams.home.id, "eventslast"),
      ])
    : [[], []];

  const relatedUpcoming = nextTeamEvents
    .filter((event) => String(event?.idEvent) !== String(match.eventId))
    .slice(0, 3);

  const relatedRecent = lastTeamEvents
    .filter((event) => String(event?.idEvent) !== String(match.eventId))
    .slice(0, 3);

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

          <LiveMatchRefresh
            matchId={match.eventId}
            initialStatus={matchStatus}
            initialHome={match.goals.home}
            initialAway={match.goals.away}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "8px",
              color: "#82968d",
              margin: "0 0 28px",
              fontSize: "14px",
            }}
          >
            <span>
              📅 {new Date(match.fixture.date).toLocaleDateString("ar-MA", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>•</span>
            <span>
              🕐 {new Date(match.fixture.date).toLocaleTimeString("ar-MA", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
              alignItems: "start",
              gap: "clamp(8px, 3vw, 24px)",
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
                  width: "100%",
                  maxWidth: "180px",
                  marginLeft: "auto",
                  marginRight: "auto",
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
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    minWidth: "110px",
    lineHeight: 1,
  }}
>
  <span>{match.goals.home ?? "—"}</span>
  <span>-</span>
  <span>{match.goals.away ?? "—"}</span>
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


        {/* الخط الزمني للمباراة */}
        {\{match.timeline?.length > 0} && (
          <section
            style={{
              marginTop: "30px",
              background: "linear-gradient(145deg, #10251c, #0b1713)",
              border: "1px solid #284238",
              borderRadius: "25px",
              padding: "25px 20px",
            }}
          >
            <p style={{ color: "#37e28a", margin: "0 0 6px", fontWeight: "800" }}>
              ⏱️ أحداث المباراة
            </p>
            <h2 style={{ margin: "0 0 20px", fontSize: "clamp(20px, 5vw, 28px)" }}>
              الخط الزمني
            </h2>

            <div style={{ display: "grid", gap: "10px" }}>
              {\{match.timeline.map((item, index) => {}
                const type = String(item.type || "").toLowerCase();
                const detail = String(item.detail || "").toLowerCase();
                const goal = String(item.goal || "").toLowerCase();
                const card = String(item.card || "").toLowerCase();

                const isGoal =
                  type.includes("goal") || detail.includes("goal") || goal.length > 0;
                const isSub =
                  type.includes("sub") || detail.includes("sub") || Boolean(item.substitute);
                const isRed = card.includes("red") || type.includes("red");
                const isYellow = card.includes("yellow") || type.includes("yellow");

                const icon = isGoal ? "⚽" : isRed ? "🟥" : isYellow ? "🟨" : isSub ? "🔄" : "•";
                const label = isGoal
                  ? "هدف"
                  : isRed
                  ? "بطاقة حمراء"
                  : isYellow
                  ? "بطاقة صفراء"
                  : isSub
                  ? "تبديل"
                  : item.type || "حدث";

                return (
                  <div
                    key={String(item.time) + "-" + (item.player || "event") + "-" + index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
                      gap: "10px",
                      alignItems: "center",
                      direction: "ltr",
                    }}
                  >
                    <div style={{ direction: "rtl", textAlign: item.team === "home" ? "right" : "left", minWidth: 0 }}>
                      {item.team === "home" && (
                        <div style={{ color: "#f4f8f6", fontWeight: "800", overflowWrap: "anywhere" }}>
                          {item.player || label}
                        </div>
                      )}
                      {item.team === "home" && item.assist && (
                        <div style={{ color: "#82968d", fontSize: "12px" }}>تمريرة: {item.assist}</div>
                      )}
                    </div>

                    <div
                      style={{
                        minWidth: "72px",
                        textAlign: "center",
                        background: "#07100d",
                        border: "1px solid #284238",
                        borderRadius: "999px",
                        padding: "8px 10px",
                        fontWeight: "900",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ marginLeft: "5px" }}>{icon}</span>
                      {item.time || "—}
                    </div>

                    <div style={{ direction: "rtl", textAlign: item.team === "away" ? "left" : "right", minWidth: 0 }}>
                      {item.team === "away" && (
                        <div style={{ color: "#f4f8f6", fontWeight: "800", overflowWrap: "anywhere" }}>
                          {item.player || label}
                        </div>
                      )}
                      {item.team === "away" && item.assist && (
                        <div style={{ color: "#82968d", fontSize: "12px" }}>تمريرة: {item.assist}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "18px",
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                color: "#82968d",
                fontSize: "12px",
                borderTop: "1px solid #284238",
                paddingTop: "14px",
              }}
            >
              <span>🏠 {match.teams.home.name}</span>
              <span>✈️ {match.teams.away.name}</span>
            </div>
          </section>
        )}

        {/* الإحصائيات والتشكيلات */}
        {(match.stats?.length > 0 || match.lineup?.length > 0) && (
          <section
            style={{
              marginTop: "30px",
              background: "linear-gradient(145deg, #10251c, #0b1713)",
              border: "1px solid #284238",
              borderRadius: "25px",
              padding: "25px 20px",
            }}
          >
            {match.stats?.length > 0 && (
              <div>
                <p style={{ color: "#37e28a", margin: "0 0 6px", fontWeight: "800" }}>
                  📊 إحصائيات المباراة
                </p>
                <h2 style={{ margin: "0 0 18px", fontSize: "clamp(20px, 5vw, 28px)" }}>
                  مقارنة الفريقين
                </h2>
                <div style={{ display: "grid", gap: "10px" }}>
                  {match.stats.map((stat) => (
                    <div key={stat.name} style={{ background: "#07100d", border: "1px solid #284238", borderRadius: "14px", padding: "13px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "10px", alignItems: "center" }}>
                        <strong style={{ textAlign: "center" }}>{stat.home ?? "—"}</strong>
                        <span style={{ color: "#82968d", textAlign: "center", fontSize: "13px" }}>{stat.name}</span>
                        <strong style={{ textAlign: "center" }}>{stat.away ?? "—"}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {match.lineup?.length > 0 && (
              <div style={{ marginTop: match.stats?.length > 0 ? "28px" : 0 }}>
                <p style={{ color: "#37e28a", margin: "0 0 6px", fontWeight: "800" }}>
                  👥 التشكيلات
                </p>
                <h2 style={{ margin: "0 0 18px", fontSize: "clamp(20px, 5vw, 28px)" }}>
                  لاعبو المباراة
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                  {[["home", match.teams.home.name], ["away", match.teams.away.name]].map(([team, teamName]) => (
                    <div key={team} style={{ background: "#07100d", border: "1px solid #284238", borderRadius: "16px", padding: "14px" }}>
                      <h3 style={{ margin: "0 0 12px", textAlign: "center", color: "#37e28a", fontSize: "15px" }}>
                        {teamName}
                      </h3>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {match.lineup.filter((player) => player.team === team).map((player, index) => (
                          <div key={player.name + index} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", borderRadius: "10px", background: "#0b1713" }}>
                            {player.image ? (
                              <img src={player.image} alt={player.name} loading="lazy" style={{ width: "34px", height: "34px", objectFit: "contain", borderRadius: "50%" }} />
                            ) : (
                              <span style={{ width: "34px", textAlign: "center" }}>👤</span>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <strong style={{ display: "block", fontSize: "13px", overflowWrap: "anywhere" }}>
                                {(player.number ? "#" + player.number + " " : "") + player.name}
                              </strong>
                              <span style={{ color: "#82968d", fontSize: "11px" }}>
                                {player.substitute ? "بديل" : (player.position || "أساسي")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* مباريات الفريق المرتبطة */}
        {(relatedUpcoming.length > 0 || relatedRecent.length > 0) && (
          <section
            style={{
              marginTop: "30px",
              background: "linear-gradient(145deg, #10251c, #0b1713)",
              border: "1px solid #284238",
              borderRadius: "25px",
              padding: "25px 20px",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <p style={{ color: "#37e28a", margin: "0 0 6px", fontWeight: "800" }}>
                📅 مباريات مرتبطة
              </p>
              <h2 style={{ margin: 0, fontSize: "clamp(20px, 5vw, 28px)" }}>
                مباريات {match.teams.home.name}
              </h2>
              <p style={{ color: "#82968d", margin: "8px 0 0", fontSize: "13px" }}>
                تابع المواعيد القادمة وآخر النتائج وانتقل مباشرة إلى تفاصيل كل مباراة.
              </p>
            </div>

            {relatedUpcoming.length > 0 && (
              <>
                <h3 style={{ margin: "0 0 12px", color: "#f4f8f6" }}>⏭️ المباريات القادمة</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {relatedUpcoming.map((event) => (
                    <a
                      key={event.idEvent}
                      href={`/matches/${event.idEvent}`}
                      style={{
                        textDecoration: "none",
                        color: "#f4f8f6",
                        background: "#07100d",
                        border: "1px solid #284238",
                        borderRadius: "16px",
                        padding: "15px",
                        display: "grid",
                        gap: "7px",
                      }}
                    >
                      <strong style={{ textAlign: "center" }}>
                        {event.strHomeTeam || "الفريق المضيف"}{" "}
                        <span style={{ color: "#37e28a" }}>ضد</span>{" "}
                        {event.strAwayTeam || "الفريق الضيف"}
                      </strong>
                      <span style={{ color: "#82968d", fontSize: "12px", textAlign: "center" }}>
                        {event.dateEvent || event.strTimestamp || "موعد المباراة"}
                        {event.strTime ? ` • ${event.strTime}` : ""}
                      </span>
                    </a>
                  ))}
                </div>
              </>
            )}

            {relatedRecent.length > 0 && (
              <div style={{ marginTop: "22px" }}>
                <h3 style={{ margin: "0 0 12px", color: "#f4f8f6" }}>🏁 آخر النتائج</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {relatedRecent.map((event) => (
                    <a
                      key={event.idEvent}
                      href={`/matches/${event.idEvent}`}
                      style={{
                        textDecoration: "none",
                        color: "#f4f8f6",
                        background: "#07100d",
                        border: "1px solid #284238",
                        borderRadius: "16px",
                        padding: "15px",
                        display: "grid",
                        gap: "7px",
                      }}
                    >
                      <strong style={{ textAlign: "center" }}>
                        {event.strHomeTeam || "الفريق المضيف"}{" "}
                        <span style={{ color: "#37e28a" }}>
                          {event.intHomeScore ?? "-"} - {event.intAwayScore ?? "-"}
                        </span>{" "}
                        {event.strAwayTeam || "الفريق الضيف"}
                      </strong>
                      <span style={{ color: "#82968d", fontSize: "12px", textAlign: "center" }}>
                        {event.dateEvent || event.strTimestamp || "تاريخ المباراة"}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

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

        {/* معلومات المباراة */}
        <section
          style={{
            marginTop: "30px",
            background: "linear-gradient(145deg, #10251c, #0b1713)",
            border: "1px solid #284238",
            borderRadius: "25px",
            padding: "25px 20px",
          }}
        >
          <h2 style={{ margin: "0 0 18px", color: "#37e28a", textAlign: "center" }}>
            📋 معلومات المباراة
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "10px",
            }}
          >
            {match.league.season && (
              <div style={{ background: "#07100d", border: "1px solid #284238", borderRadius: "14px", padding: "13px", textAlign: "center" }}>
                <div style={{ color: "#82968d", fontSize: "12px" }}>الموسم</div>
                <strong>{match.league.season}</strong>
              </div>
            )}
            {match.league.country && (
              <div style={{ background: "#07100d", border: "1px solid #284238", borderRadius: "14px", padding: "13px", textAlign: "center" }}>
                <div style={{ color: "#82968d", fontSize: "12px" }}>الدولة</div>
                <strong>{match.league.country}</strong>
              </div>
            )}
            {match.league.round && (
              <div style={{ background: "#07100d", border: "1px solid #284238", borderRadius: "14px", padding: "13px", textAlign: "center" }}>
                <div style={{ color: "#82968d", fontSize: "12px" }}>الجولة</div>
                <strong>{match.league.round}</strong>
              </div>
            )}
            {match.fixture.venue?.name && (
              <div style={{ background: "#07100d", border: "1px solid #284238", borderRadius: "14px", padding: "13px", textAlign: "center" }}>
                <div style={{ color: "#82968d", fontSize: "12px" }}>الملعب</div>
                <strong>{match.fixture.venue.name}</strong>
              </div>
            )}
          </div>
        </section>

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
