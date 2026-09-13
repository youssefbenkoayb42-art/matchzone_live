"use client";

import { useEffect, useMemo, useState } from "react";

function getArabicLeague(league) {
  const map = {
    "Premier League": "الدوري الإنجليزي",
    "La Liga": "الدوري الإسباني",
    "Serie A": "الدوري الإيطالي",
    Bundesliga: "الدوري الألماني",
    "Ligue 1": "الدوري الفرنسي",
  };

  return map[league] || league || "بطولة كرة القدم";
}

function getStatusType(status) {
  const value = String(status || "").toUpperCase();

  if (
    value === "LIVE" ||
    value === "1H" ||
    value === "2H" ||
    value === "HT" ||
    value === "ET" ||
    value === "P" ||
    value === "LIVE"
  ) {
    return "live";
  }

  if (
    value === "FT" ||
    value === "AET" ||
    value === "PEN" ||
    value === "FINISHED"
  ) {
    return "finished";
  }

  return "upcoming";
}

function formatTime(date) {
  if (!date) return "--:--";

  try {
    return new Date(date).toLocaleTimeString("ar-MA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

function normalizeMatch(item) {
  return {
    id: item?.fixture?.id,

    time: formatTime(item?.fixture?.date),

    date: item?.fixture?.date,

    home: item?.teams?.home?.name || "الفريق المضيف",

    homeLogo: item?.teams?.home?.logo || null,

    away: item?.teams?.away?.name || "الفريق الضيف",

    awayLogo: item?.teams?.away?.logo || null,

    status: item?.fixture?.status?.short || "NS",

    homeScore:
      item?.goals?.home !== undefined ? item.goals.home : null,

    awayScore:
      item?.goals?.away !== undefined ? item.goals.away : null,

    league: item?.league?.name || "Football",

    arabicLeague: getArabicLeague(item?.league?.name),

    leagueLogo: item?.league?.logo || null,
  };
}

export default function HomeDesign() {
  const [search, setSearch] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("الكل");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [matches, setMatches] = useState([]);
  const [news, setNews] = useState([]);

  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  const [matchesError, setMatchesError] = useState("");
  const [newsError, setNewsError] = useState("");

  const [visibleNews, setVisibleNews] = useState(6);

  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoadingMatches(true);
        setMatchesError("");

        const res = await fetch("/api/football", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("فشل الاتصال بمصدر المباريات");
        }

        const data = await res.json();

        const formattedMatches = (data.response || [])
          .map(normalizeMatch)
          .filter((match) => match.id);

        setMatches(formattedMatches);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("خطأ في جلب المباريات:", error);
        setMatchesError(
          "تعذر تحميل المباريات حاليًا. حاول تحديث الصفحة."
        );
      } finally {
        setLoadingMatches(false);
      }
    }

    fetchMatches();
  }, []);

  useEffect(() => {
    async function fetchSportsNews() {
      try {
        setLoadingNews(true);
        setNewsError("");

        const res = await fetch("/api/news", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("فشل الاتصال بالأخبار");
        }

        const data = await res.json();

        if (Array.isArray(data.articles)) {
          setNews(data.articles);
        } else {
          setNews([]);
        }
      } catch (error) {
        console.error("خطأ في جلب الأخبار:", error);

        setNewsError(
          "تعذر تحميل الأخبار حاليًا."
        );
      } finally {
        setLoadingNews(false);
      }
    }

    fetchSportsNews();
  }, []);

  const leagues = useMemo(() => {
    return [
      "الكل",
      ...new Set(
        matches
          .map((match) => match.arabicLeague)
          .filter(Boolean)
      ),
    ];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        match.home.toLowerCase().includes(searchValue) ||
        match.away.toLowerCase().includes(searchValue) ||
        match.arabicLeague.toLowerCase().includes(searchValue);

      const matchesLeague =
        selectedLeague === "الكل" ||
        match.arabicLeague === selectedLeague;

      const statusType = getStatusType(match.status);

      const matchesStatus =
        selectedStatus === "all" ||
        statusType === selectedStatus;

      return (
        matchesSearch &&
        matchesLeague &&
        matchesStatus
      );
    });
  }, [
    matches,
    search,
    selectedLeague,
    selectedStatus,
  ]);

  const liveMatches = filteredMatches.filter(
    (match) => getStatusType(match.status) === "live"
  );

  const featuredMatch =
    liveMatches[0] ||
    filteredMatches.find(
      (match) =>
        getStatusType(match.status) === "upcoming"
    ) ||
    filteredMatches[0];

  const loadMoreNews = () => {
    setVisibleNews((prev) => prev + 6);
  };

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #123326 0%, #07100d 38%, #050a08 100%)",
        color: "#fff",
        fontFamily:
          "Arial, Helvetica, sans-serif",
        paddingBottom: "60px",
      }}
    >      {/* =========================
          HEADER
      ========================== */}

      <header
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
          padding: "22px 18px 10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/"
            style={{
              textDecoration: "none",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "15px",
                background:
                  "linear-gradient(135deg,#2ecc71,#1abc9c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                boxShadow:
                  "0 8px 25px rgba(46,204,113,.2)",
              }}
            >
              ⚽
            </div>

            <div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "900",
                  letterSpacing: "-.5px",
                }}
              >
                MatchZone
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#718078",
                  marginTop: "2px",
                }}
              >
                عالم كرة القدم بين يديك
              </div>
            </div>
          </a>

          <nav
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/"
              style={{
                color: "#2ecc71",
                background: "rgba(46,204,113,.08)",
                border: "1px solid rgba(46,204,113,.15)",
                padding: "9px 15px",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              المباريات
            </a>

            <a
              href="#news-section"
              style={{
                color: "#b7c1bc",
                padding: "9px 15px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              الأخبار
            </a>

            <a
              href="/leagues"
              style={{
                color: "#b7c1bc",
                padding: "9px 15px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              البطولات
            </a>
          </nav>
        </div>

        {/* =========================
            SEARCH
        ========================== */}

        <div
          style={{
            marginTop: "28px",
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              right: "18px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "18px",
              opacity: ".7",
            }}
          >
            🔎
          </span>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="ابحث عن فريق أو بطولة..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background:
                "rgba(255,255,255,.045)",
              border:
                "1px solid rgba(255,255,255,.08)",
              color: "#fff",
              padding: "17px 50px 17px 18px",
              borderRadius: "16px",
              outline: "none",
              fontSize: "14px",
              direction: "rtl",
            }}
          />
        </div>
      </header>

      {/* =========================
          MAIN CONTENT
      ========================== */}

      <div
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
          padding: "15px 18px",
        }}
      >

        {/* =========================
            TOP STATS
        ========================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(160px,1fr))",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(145deg,rgba(46,204,113,.11),rgba(255,255,255,.025))",
              border:
                "1px solid rgba(46,204,113,.12)",
              borderRadius: "18px",
              padding: "17px",
            }}
          >
            <div
              style={{
                color: "#718078",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              إجمالي المباريات
            </div>

            <div
              style={{
                fontSize: "25px",
                fontWeight: "900",
              }}
            >
              {matches.length}
            </div>
          </div>

          <div
            style={{
              background:
                "rgba(255,255,255,.025)",
              border:
                "1px solid rgba(255,255,255,.06)",
              borderRadius: "18px",
              padding: "17px",
            }}
          >
            <div
              style={{
                color: "#718078",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              مباشر الآن
            </div>

            <div
              style={{
                fontSize: "25px",
                fontWeight: "900",
                color:
                  liveMatches.length > 0
                    ? "#ff4d4d"
                    : "#fff",
              }}
            >
              {liveMatches.length}
            </div>
          </div>

          <div
            style={{
              background:
                "rgba(255,255,255,.025)",
              border:
                "1px solid rgba(255,255,255,.06)",
              borderRadius: "18px",
              padding: "17px",
            }}
          >
            <div
              style={{
                color: "#718078",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              البطولات
            </div>

            <div
              style={{
                fontSize: "25px",
                fontWeight: "900",
              }}
            >
              {leagues.length > 0
                ? leagues.length - 1
                : 0}
            </div>
          </div>

          <div
            style={{
              background:
                "rgba(255,255,255,.025)",
              border:
                "1px solid rgba(255,255,255,.06)",
              borderRadius: "18px",
              padding: "17px",
            }}
          >
            <div
              style={{
                color: "#718078",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              آخر تحديث
            </div>

            <div
              style={{
                fontSize: "14px",
                fontWeight: "800",
                marginTop: "9px",
              }}
            >
              {lastUpdated
                ? lastUpdated.toLocaleTimeString(
                    "ar-MA",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                : "--:--"}
            </div>
          </div>
        </div>

        {/* =========================
            FEATURED MATCH
        ========================== */}

        {featuredMatch && (
          <section
            style={{
              position: "relative",
              overflow: "hidden",
              marginBottom: "32px",
              borderRadius: "25px",
              padding: "28px 22px",
              background:
                "linear-gradient(135deg,#123c2b 0%,#0b241a 55%,#08140f 100%)",
              border:
                "1px solid rgba(46,204,113,.18)",
              boxShadow:
                "0 20px 55px rgba(0,0,0,.3)",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background:
                  "rgba(46,204,113,.08)",
                left: "-80px",
                top: "-90px",
                filter: "blur(5px)",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "25px",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#2ecc71",
                    fontSize: "12px",
                    fontWeight: "800",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#2ecc71",
                      boxShadow:
                        "0 0 12px #2ecc71",
                    }}
                  />

                  {getStatusType(
                    featuredMatch.status
                  ) === "live"
                    ? "مباراة مباشرة"
                    : "المباراة الأبرز"}
                </div>

                <div
                  style={{
                    color: "#91a29a",
                    fontSize: "12px",
                  }}
                >
                  {featuredMatch.arabicLeague}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "30px",
                  textAlign: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: "120px",
                  }}
                >
                  {featuredMatch.homeLogo && (
                    <img
                      src={featuredMatch.homeLogo}
                      alt={featuredMatch.home}
                      style={{
                        width: "70px",
                        height: "70px",
                        objectFit: "contain",
                        marginBottom: "10px",
                      }}
                    />
                  )}

                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "800",
                    }}
                  >
                    {featuredMatch.home}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      color: "#83938b",
                      fontSize: "12px",
                      marginBottom: "7px",
                    }}
                  >
                    {getStatusType(
                      featuredMatch.status
                    ) === "upcoming"
                      ? "موعد المباراة"
                      : "النتيجة"}
                  </div>

                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: "900",
                      letterSpacing: "2px",
                      direction: "ltr",
                    }}
                  >
                    {getStatusType(
                      featuredMatch.status
                    ) === "upcoming"
                      ? featuredMatch.time
                      : `${featuredMatch.homeScore ?? 0} - ${featuredMatch.awayScore ?? 0}`}
                  </div>

                  <div
                    style={{
                      marginTop: "7px",
                      color:
                        getStatusType(
                          featuredMatch.status
                        ) === "live"
                          ? "#ff4d4d"
                          : "#9aa8a1",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {getStatusType(
                      featuredMatch.status
                    ) === "live"
                      ? "🔴 مباشر الآن"
                      : getStatusType(
                            featuredMatch.status
                          ) === "finished"
                        ? "انتهت المباراة"
                        : "⏰ لم تبدأ"}
                  </div>
                </div>

                <div
                  style={{
                    width: "120px",
                  }}
                >
                  {featuredMatch.awayLogo && (
                    <img
                      src={featuredMatch.awayLogo}
                      alt={featuredMatch.away}
                      style={{
                        width: "70px",
                        height: "70px",
                        objectFit: "contain",
                        marginBottom: "10px",
                      }}
                    />
                  )}

                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "800",
                    }}
                  >
                    {featuredMatch.away}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {/* =========================
            MATCHES CONTROL BAR
        ========================== */}

        <section id="matches-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "18px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "21px",
                  fontWeight: "900",
                }}
              >
                🗓️ مباريات اليوم
              </div>

              <div
                style={{
                  color: "#718078",
                  fontSize: "12px",
                  marginTop: "6px",
                }}
              >
                تابع نتائج ومواعيد أهم مباريات كرة القدم
              </div>
            </div>

            <div
              style={{
                color: "#718078",
                fontSize: "12px",
              }}
            >
              {filteredMatches.length} مباراة
            </div>
          </div>

          {/* =========================
              STATUS FILTER
          ========================== */}

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "15px",
            }}
          >
            {[
              {
                id: "all",
                label: "الكل",
              },
              {
                id: "live",
                label: "🔴 مباشر",
              },
              {
                id: "upcoming",
                label: "⏰ القادمة",
              },
              {
                id: "finished",
                label: "✅ انتهت",
              },
            ].map((button) => (
              <button
                key={button.id}
                onClick={() =>
                  setSelectedStatus(button.id)
                }
                style={{
                  padding: "9px 16px",
                  borderRadius: "12px",
                  border:
                    selectedStatus === button.id
                      ? "1px solid rgba(46,204,113,.5)"
                      : "1px solid rgba(255,255,255,.07)",
                  background:
                    selectedStatus === button.id
                      ? "#2ecc71"
                      : "rgba(255,255,255,.025)",
                  color:
                    selectedStatus === button.id
                      ? "#06100b"
                      : "#d6ddd9",
                  fontWeight: "800",
                  cursor: "pointer",
                  fontSize: "12px",
                  transition: "all .2s ease",
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          {/* =========================
              LEAGUE FILTER
          ========================== */}

          <div
            style={{
              display: "flex",
              gap: "9px",
              overflowX: "auto",
              paddingBottom: "8px",
              marginBottom: "25px",
              scrollbarWidth: "thin",
            }}
          >
            {leagues.map((league) => (
              <button
                key={league}
                onClick={() =>
                  setSelectedLeague(league)
                }
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 14px",
                  borderRadius: "12px",
                  border:
                    selectedLeague === league
                      ? "1px solid rgba(46,204,113,.4)"
                      : "1px solid rgba(255,255,255,.06)",
                  background:
                    selectedLeague === league
                      ? "rgba(46,204,113,.12)"
                      : "rgba(255,255,255,.025)",
                  color:
                    selectedLeague === league
                      ? "#2ecc71"
                      : "#aeb9b3",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                {league}
              </button>
            ))}
          </div>

          {/* =========================
              LOADING
          ========================== */}

          {loadingMatches && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(280px,1fr))",
                gap: "15px",
              }}
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  style={{
                    height: "230px",
                    borderRadius: "20px",
                    background:
                      "linear-gradient(90deg,rgba(255,255,255,.025),rgba(255,255,255,.05),rgba(255,255,255,.025))",
                    border:
                      "1px solid rgba(255,255,255,.05)",
                  }}
                />
              ))}
            </div>
          )}

          {/* =========================
              ERROR
          ========================== */}

          {!loadingMatches &&
            matchesError && (
              <div
                style={{
                  padding: "25px",
                  borderRadius: "18px",
                  background:
                    "rgba(255,77,77,.06)",
                  border:
                    "1px solid rgba(255,77,77,.15)",
                  color: "#ff8a8a",
                  textAlign: "center",
                  marginBottom: "20px",
                }}
              >
                ⚠️ {matchesError}
              </div>
            )}

          {/* =========================
              EMPTY
          ========================== */}

          {!loadingMatches &&
            !matchesError &&
            filteredMatches.length === 0 && (
              <div
                style={{
                  padding: "45px 20px",
                  borderRadius: "20px",
                  background:
                    "rgba(255,255,255,.025)",
                  border:
                    "1px solid rgba(255,255,255,.06)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "38px",
                    marginBottom: "12px",
                  }}
                >
                  🔍
                </div>

                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    marginBottom: "7px",
                  }}
                >
                  لا توجد مباريات
                </div>

                <div
                  style={{
                    color: "#718078",
                    fontSize: "12px",
                  }}
                >
                  جرّب تغيير البطولة أو حالة المباراة
                </div>
              </div>
            )}

          {/* =========================
              MATCH CARDS
          ========================== */}

          {!loadingMatches &&
            filteredMatches.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(280px,1fr))",
                  gap: "15px",
                }}
              >
                {filteredMatches.map((match) => {
                  const statusType =
                    getStatusType(match.status);

                  return (
                    <article
                      key={match.id}
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        background:
                          "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))",
                        border:
                          statusType === "live"
                            ? "1px solid rgba(255,77,77,.2)"
                            : "1px solid rgba(255,255,255,.06)",
                        borderRadius: "20px",
                        padding: "18px",
                        boxShadow:
                          "0 12px 30px rgba(0,0,0,.18)",
                      }}
                    >
                      {/* Top league row */}

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "20px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                            minWidth: 0,
                          }}
                        >
                          {match.leagueLogo && (
                            <img
                              src={match.leagueLogo}
                              alt=""
                              style={{
                                width: "25px",
                                height: "25px",
                                objectFit: "contain",
                              }}
                            />
                          )}

                          <span
                            style={{
                              color: "#2ecc71",
                              fontSize: "11px",
                              fontWeight: "800",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow:
                                "ellipsis",
                            }}
                          >
                            {match.arabicLeague}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: "10px",
                            color:
                              statusType === "live"
                                ? "#ff6b6b"
                                : "#718078",
                            fontWeight: "800",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {statusType === "live"
                            ? "● مباشر"
                            : statusType ===
                                "finished"
                              ? "انتهت"
                              : match.time}
                        </span>
                      </div>

                      {/* Teams */}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1fr auto 1fr",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {/* Home */}

                        <div
                          style={{
                            textAlign: "center",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: "65px",
                              height: "65px",
                              margin: "0 auto 10px",
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                            }}
                          >
                            {match.homeLogo ? (
                              <img
                                src={
                                  match.homeLogo
                                }
                                alt={match.home}
                                style={{
                                  width: "58px",
                                  height: "58px",
                                  objectFit:
                                    "contain",
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontSize: "30px",
                                }}
                              >
                                ⚽
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "800",
                              whiteSpace:
                                "nowrap",
                              overflow: "hidden",
                              textOverflow:
                                "ellipsis",
                            }}
                          >
                            {match.home}
                          </div>
                        </div>

                        {/* Score */}

                        <div
                          style={{
                            textAlign: "center",
                            minWidth: "75px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "21px",
                              fontWeight: "900",
                              direction: "ltr",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {statusType ===
                            "upcoming"
                              ? match.time
                              : `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`}
                          </div>

                          <div
                            style={{
                              marginTop: "7px",
                              fontSize: "10px",
                              color:
                                statusType ===
                                "live"
                                  ? "#ff5b5b"
                                  : "#718078",
                              fontWeight: "800",
                            }}
                          >
                            {statusType ===
                            "live"
                              ? "🔴 مباشر"
                              : statusType ===
                                  "finished"
                                ? "النهاية"
                                : "موعد المباراة"}
                          </div>
                        </div>

                        {/* Away */}

                        <div
                          style={{
                            textAlign: "center",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: "65px",
                              height: "65px",
                              margin: "0 auto 10px",
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                            }}
                          >
                            {match.awayLogo ? (
                              <img
                                src={
                                  match.awayLogo
                                }
                                alt={match.away}
                                style={{
                                  width: "58px",
                                  height: "58px",
                                  objectFit:
                                    "contain",
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontSize: "30px",
                                }}
                              >
                                ⚽
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "800",
                              whiteSpace:
                                "nowrap",
                              overflow: "hidden",
                              textOverflow:
                                "ellipsis",
                            }}
                          >
                            {match.away}
                          </div>
                        </div>
                      </div>

                      {/* Match details */}

                      <a
                        href={`/matches/${match.id}`}
                        style={{
                          display: "block",
                          marginTop: "20px",
                          textAlign: "center",
                          textDecoration: "none",
                          color: "#cbd5d0",
                          background:
                            "rgba(255,255,255,.035)",
                          border:
                            "1px solid rgba(255,255,255,.06)",
                          padding: "11px",
                          borderRadius: "11px",
                          fontSize: "11px",
                          fontWeight: "800",
                          transition:
                            "background .2s",
                        }}
                      >
                        تفاصيل المباراة ←
                      </a>
                    </article>
                  );
                })}
              </div>
            )}
        </section>
        {/* =========================
            NEWS SECTION
        ========================== */}

        <section
          id="news-section"
          style={{
            marginTop: "55px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "15px",
              marginBottom: "22px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "900",
                }}
              >
                📰 آخر الأخبار الرياضية
              </div>

              <div
                style={{
                  color: "#718078",
                  fontSize: "12px",
                  marginTop: "7px",
                }}
              >
                أحدث الأخبار والمستجدات الرياضية
              </div>
            </div>

            <div
              style={{
                color: "#2ecc71",
                fontSize: "12px",
                fontWeight: "800",
              }}
            >
              ⚡ تحديث مستمر
            </div>
          </div>

          {/* NEWS ERROR */}

          {newsError && (
            <div
              style={{
                padding: "20px",
                borderRadius: "18px",
                background:
                  "rgba(255,77,77,.06)",
                border:
                  "1px solid rgba(255,77,77,.15)",
                color: "#ff8a8a",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              ⚠️ {newsError}
            </div>
          )}

          {/* NEWS LOADING */}

          {loadingNews && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(280px,1fr))",
                gap: "16px",
              }}
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  style={{
                    height: "310px",
                    borderRadius: "20px",
                    background:
                      "rgba(255,255,255,.025)",
                    border:
                      "1px solid rgba(255,255,255,.05)",
                  }}
                />
              ))}
            </div>
          )}

          {/* NEWS CARDS */}

          {!loadingNews &&
            news.length > 0 && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(280px,1fr))",
                    gap: "18px",
                  }}
                >
                  {news
                    .slice(0, visibleNews)
                    .map((article, index) => {
                      const image =
                        article.image ||
                        article.urlToImage ||
                        null;

                      const title =
                        article.title ||
                        "خبر رياضي جديد";

                      const description =
                        article.description ||
                        "تابع أحدث التفاصيل والمستجدات الرياضية عبر MatchZone.";

                      const source =
                        article.source?.name ||
                        article.source ||
                        "MatchZone";

                      const published =
                        article.publishedAt ||
                        article.published_at ||
                        null;

                      return (
                        <article
                          key={
                            article.url ||
                            `${title}-${index}`
                          }
                          style={{
                            overflow: "hidden",
                            borderRadius: "20px",
                            background:
                              "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))",
                            border:
                              "1px solid rgba(255,255,255,.06)",
                            boxShadow:
                              "0 15px 35px rgba(0,0,0,.2)",
                            transition:
                              "transform .2s ease, border .2s ease",
                          }}
                        >
                          {/* IMAGE */}

                          <div
                            style={{
                              width: "100%",
                              height: "175px",
                              overflow: "hidden",
                              background:
                                "linear-gradient(135deg,#123326,#07100d)",
                            }}
                          >
                            {image ? (
                              <img
                                src={image}
                                alt={title}
                                loading="lazy"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "48px",
                                }}
                              >
                                📰
                              </div>
                            )}
                          </div>

                          {/* CONTENT */}

                          <div
                            style={{
                              padding: "18px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent:
                                  "space-between",
                                alignItems: "center",
                                gap: "10px",
                                marginBottom: "12px",
                              }}
                            >
                              <span
                                style={{
                                  color: "#2ecc71",
                                  fontSize: "10px",
                                  fontWeight: "900",
                                }}
                              >
                                📰 {source}
                              </span>

                              {published && (
                                <span
                                  style={{
                                    color: "#68756f",
                                    fontSize: "10px",
                                  }}
                                >
                                  {new Date(
                                    published
                                  ).toLocaleDateString(
                                    "ar-MA"
                                  )}
                                </span>
                              )}
                            </div>

                            <h3
                              style={{
                                margin:
                                  "0 0 10px 0",
                                fontSize: "15px",
                                lineHeight: "1.65",
                                fontWeight: "900",
                                color: "#fff",
                              }}
                            >
                              {title}
                            </h3>

                            <p
                              style={{
                                margin:
                                  "0 0 18px 0",
                                color: "#819088",
                                fontSize: "12px",
                                lineHeight: "1.7",
                              }}
                            >
                              {description.length >
                              120
                                ? `${description.slice(
                                    0,
                                    120
                                  )}...`
                                : description}
                            </p>

                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "space-between",
                                textDecoration:
                                  "none",
                                color: "#2ecc71",
                                background:
                                  "rgba(46,204,113,.07)",
                                border:
                                  "1px solid rgba(46,204,113,.1)",
                                padding:
                                  "10px 13px",
                                borderRadius: "11px",
                                fontSize: "11px",
                                fontWeight: "900",
                              }}
                            >
                              <span>
                                قراءة الخبر
                              </span>

                              <span>
                                ←
                              </span>
                            </a>
                          </div>
                        </article>
                      );
                    })}
                </div>

                {/* LOAD MORE */}

                {visibleNews < news.length && (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "28px",
                    }}
                  >
                    <button
                      onClick={loadMoreNews}
                      style={{
                        border: "1px solid rgba(46,204,113,.2)",
                        background:
                          "rgba(46,204,113,.07)",
                        color: "#2ecc71",
                        padding:
                          "13px 30px",
                        borderRadius: "14px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "900",
                      }}
                    >
                      🔄 تحميل المزيد من الأخبار
                    </button>
                  </div>
                )}
              </>
            )}

          {/* NO NEWS */}

          {!loadingNews &&
            !newsError &&
            news.length === 0 && (
              <div
                style={{
                  padding: "45px 20px",
                  borderRadius: "20px",
                  background:
                    "rgba(255,255,255,.025)",
                  border:
                    "1px solid rgba(255,255,255,.06)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "42px",
                    marginBottom: "12px",
                  }}
                >
                  📰
                </div>

                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "900",
                    marginBottom: "7px",
                  }}
                >
                  لا توجد أخبار حاليًا
                </div>

                <div
                  style={{
                    color: "#718078",
                    fontSize: "12px",
                  }}
                >
                  سنعرض الأخبار فور توفرها.
                </div>
              </div>
            )}
        </section>

        {/* =========================
            FOOTER
        ========================== */}

        <footer
          style={{
            marginTop: "65px",
            padding:
              "30px 0 15px",
            borderTop:
              "1px solid rgba(255,255,255,.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "900",
                }}
              >
                ⚽ MatchZone
              </div>

              <div
                style={{
                  color: "#68756f",
                  fontSize: "11px",
                  marginTop: "6px",
                }}
              >
                منصة عصرية للمباريات والنتائج
                والأخبار الرياضية.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <a
                href="#matches-section"
                style={{
                  color: "#87948e",
                  textDecoration:
                    "none",
                  fontSize: "11px",
                }}
              >
                المباريات
              </a>

              <a
                href="#news-section"
                style={{
                  color: "#87948e",
                  textDecoration:
                    "none",
                  fontSize: "11px",
                }}
              >
                الأخبار
              </a>

              <a
                href="#"
                style={{
                  color: "#87948e",
                  textDecoration:
                    "none",
                  fontSize: "11px",
                }}
              >
                العودة للأعلى ↑
              </a>
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: "30px",
              paddingTop: "15px",
              borderTop:
                "1px solid rgba(255,255,255,.04)",
              color: "#4f5b56",
              fontSize: "10px",
            }}
          >
            © 2026 MatchZone — جميع الحقوق محفوظة
          </div>
        </footer>
      </div>
    </main>
  );
                }
