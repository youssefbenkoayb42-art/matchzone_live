"use client";

import { useState, useEffect } from "react";



function getStatusType(status) {
  if (status === "FT") return "finished";
  if (status === "NS") return "upcoming";

  return "live";
}

function getArabicLeague(league) {
  const map = {
    "Premier League": "الدوري الإنجليزي",
    "La Liga": "الدوري الإسباني",
    "Serie A": "الدوري الإيطالي",
    Bundesliga: "الدوري الألماني",
    "Ligue 1": "الدوري الفرنسي",
  };

  return map[league] || league;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("الكل");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [matches, setMatches] = useState([]);
const leagues = [
  ...new Set(matches.map((match) => match.arabicLeague)),
].sort();
  useEffect(() => {
    fetch("/api/football")
      .then((res) => res.json())
      .then((data) => {
        const formattedMatches = (data.response || []).map((item) => ({
          id: item.fixture.id,

          time: new Date(item.fixture.date).toLocaleTimeString("ar-MA", {
            hour: "2-digit",
            minute: "2-digit",
          }),

          home: item.teams.home.name,
          homeLogo: item.teams.home.logo,

          away: item.teams.away.name,
          awayLogo: item.teams.away.logo,

          status: item.fixture.status.short,

          homeScore: item.goals.home,
          awayScore: item.goals.away,

          league: item.league.name,
          arabicLeague: getArabicLeague(item.league.name),
        }));

        setMatches(formattedMatches);

        console.log("عدد المباريات:", formattedMatches.length);
      })
      .catch((error) => {
        console.error("خطأ في جلب المباريات:", error);
      });
  }, []);

  const filteredMatches = matches.filter((match) => {
    const matchesSearch =
      match.home.toLowerCase().includes(search.toLowerCase()) ||
      match.away.toLowerCase().includes(search.toLowerCase());

    const matchesLeague =
      selectedLeague === "الكل" ||
      match.arabicLeague === selectedLeague;

    const statusType = getStatusType(match.status);

    const matchesStatus =
      selectedStatus === "all" ||
      statusType === selectedStatus;

    return matchesSearch && matchesLeague && matchesStatus;
  });
  const sortedMatches = [...filteredMatches].sort((a, b) => {
  const statusOrder = {
    live: 1,
    upcoming: 2,
    finished: 3,
  };

  const statusA = getStatusType(a.status);
  const statusB = getStatusType(b.status);

  const orderDifference =
    statusOrder[statusA] - statusOrder[statusB];

  if (orderDifference !== 0) {
    return orderDifference;
  }

  return a.time.localeCompare(b.time, "ar-MA");
});
  const liveMatches = sortedMatches.filter(
  (match) => getStatusType(match.status) === "live"
);

const upcomingMatches = sortedMatches.filter(
  (match) => getStatusType(match.status) === "upcoming"
);

const finishedMatches = sortedMatches.filter(
  (match) => getStatusType(match.status) === "finished"
);
  const featuredMatch =
  liveMatches[0] ||
  upcomingMatches[0] ||
  finishedMatches[0] ||
  null;

  return (
    <main>
      <header>
        <div className="logo">
          ⚽ Match<span>Zone</span>
        </div>

        <nav>
          <a href="#matches">المباريات</a>
          <a href="#leagues">البطولات</a>
          <a href="#news">الأخبار</a>
        </nav>

        <input
          className="search"
          type="text"
          placeholder="⌕ بحث"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <section className="hero">
        <div className="hero-text">
          <p className="tag">MATCHZONE • SPORTS PLATFORM</p>

          <div className="hero-card">
  {featuredMatch ? (
    <>
      <div className="live">
        {getStatusType(featuredMatch.status) === "live"
          ? "🔴 مباشر الآن"
          : getStatusType(featuredMatch.status) === "upcoming"
          ? "⏰ المباراة القادمة"
          : "✅ آخر نتيجة"}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "15px",
          margin: "15px 0",
        }}
      >
        {/* الفريق الأول */}
        <div style={{ textAlign: "center", maxWidth: "110px" }}>
          {featuredMatch.homeLogo && (
            <img
              src={featuredMatch.homeLogo}
              alt={featuredMatch.home}
              style={{
                width: "55px",
                height: "55px",
                objectFit: "contain",
              }}
            />
          )}

          <p style={{ margin: "8px 0 0" }}>
            {featuredMatch.home}
          </p>
        </div>

        {/* النتيجة أو الوقت */}
        <div>
          <div className="score">
            {getStatusType(featuredMatch.status) === "upcoming"
              ? featuredMatch.time
              : `${featuredMatch.homeScore ?? 0} — ${
                  featuredMatch.awayScore ?? 0
                }`}
          </div>
        </div>

        {/* الفريق الثاني */}
        <div style={{ textAlign: "center", maxWidth: "110px" }}>
          {featuredMatch.awayLogo && (
            <img
              src={featuredMatch.awayLogo}
              alt={featuredMatch.away}
              style={{
                width: "55px",
                height: "55px",
                objectFit: "contain",
              }}
            />
          )}

          <p style={{ margin: "8px 0 0" }}>
            {featuredMatch.away}
          </p>
        </div>
      </div>
      
      <small>
        🏆 {featuredMatch.arabicLeague}
      </small>
    </>
  ) : (
    <>
      <div className="live">⚽ MatchZone Live</div>
      <div className="score">—</div>
      <small>جاري تحميل المباريات...</small>
    </>
  )}
</div>

</div>
        
      </section>

      <div className="ad">
        مساحة إعلانية
      </div>

      <section id="matches" className="section">

        <div className="section-title">
          <div>
            <p className="tag">TODAY</p>
            <h2>مباريات اليوم</h2>
          </div>

          <select
            className="filter"
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
          >
            <option value="الكل">جميع البطولات</option>

            {leagues.map((league) => (
              <option key={league} value={league}>
                {league}
              </option>
            ))}
          </select>
        </div>

        {/* فلاتر حالة المباريات */}

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "25px",
          }}
        >
          <button
            onClick={() => setSelectedStatus("all")}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              border: "1px solid #284238",
              background:
                selectedStatus === "all"
                  ? "#37e28a"
                  : "#10251c",
              color:
                selectedStatus === "all"
                  ? "#07100d"
                  : "#f4f8f6",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            الكل
          </button>

          <button
            onClick={() => setSelectedStatus("live")}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              border: "1px solid #284238",
              background:
                selectedStatus === "live"
                  ? "#37e28a"
                  : "#10251c",
              color:
                selectedStatus === "live"
                  ? "#07100d"
                  : "#f4f8f6",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            🔴 مباشر
          </button>

          <button
            onClick={() => setSelectedStatus("upcoming")}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              border: "1px solid #284238",
              background:
                selectedStatus === "upcoming"
                  ? "#37e28a"
                  : "#10251c",
              color:
                selectedStatus === "upcoming"
                  ? "#07100d"
                  : "#f4f8f6",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            ⏰ لم تبدأ
          </button>

          <button
            onClick={() => setSelectedStatus("finished")}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              border: "1px solid #284238",
              background:
                selectedStatus === "finished"
                  ? "#37e28a"
                  : "#10251c",
              color:
                selectedStatus === "finished"
                  ? "#07100d"
                  : "#f4f8f6",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            ✅ انتهت
          </button>
        </div>

        <div className="matches">

          {matches.length === 0 && (
            <div className="empty-matches">
              <strong>MatchZone</strong>
              <p>عدد المباريات: 0</p>
              <small>لم يتم جلب أي مباريات حاليًا</small>
            </div>
          )}

          {matches.length > 0 &&
            filteredMatches.length === 0 && (
              <div className="empty-matches">
                <strong>MatchZone</strong>
                <p>لا توجد مباريات</p>
                <small>
                  لا توجد مباريات تطابق الفلتر المحدد حاليًا
                </small>
              </div>
            )}

          {sortedMatches.map((match) => {
            const statusType = getStatusType(match.status);

            return (
              <div className="match" key={match.id}>

                <div className="competition">
                  🏆 {match.arabicLeague}
                </div>

                <div className="teams">

                  <div className="team">
                    <img
                      src={match.homeLogo}
                      alt={match.home}
                      className="team-logo"
                    />
                    <strong>{match.home}</strong>
                  </div>

                  <div className="match-time">

                    {statusType === "upcoming" ? (
                      <strong>{match.time}</strong>
                    ) : (
                      <strong>
                        {match.homeScore ?? 0} -{" "}
                        {match.awayScore ?? 0}
                      </strong>
                    )}

                    <span
                      className={
                        statusType === "live"
                          ? "live-status"
                          : "match-status"
                      }
                    >
                      {statusType === "live"
                        ? "🔴 مباشر"
                        : statusType === "finished"
                        ? "انتهت"
                        : "لم تبدأ"}
                    </span>

                  </div>

                  <div className="team">
                    <img
                      src={match.awayLogo}
                      alt={match.away}
                      className="team-logo"
                    />
                    <strong>{match.away}</strong>
                  </div>

                </div>

                <a
                  href={`/matches/${match.id}`}
                  className="details"
                >
                  تفاصيل المباراة
                </a>

              </div>
            );
          })}

        </div>
      </section>

      <section id="news" className="section">

        <div className="section-title">
          <div>
            <p className="tag">NEWS</p>
            <h2>آخر الأخبار</h2>
          </div>
        </div>

        <div className="news-grid">

          <article>
            <div className="news-image">⚽</div>
            <h3>مباريات اليوم</h3>
            <p>
              تابع أهم مباريات كرة القدم ومواعيدها.
            </p>
          </article>

          <article>
            <div className="news-image">🏆</div>
            <h3>أهم البطولات</h3>
            <p>
              اكتشف أحدث أخبار البطولات العالمية.
            </p>
          </article>

          {/* 🧩 1. الأقسام الثلاثة بعد تفعيلها وتحويلها لروابط تعمل */}
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px", marginBottom: "40px", direction: "rtl" }}>
  <a href="#matches" style={{ textDecoration: "none", color: "inherit" }}>
    <div style={{ background: "#142820", padding: "20px", borderRadius: "12px", cursor: "pointer", border: "1px solid #1e3d30" }}>
      <h3>⚽ مباريات اليوم</h3>
      <p style={{ fontSize: "14px", color: "#aaa", margin: "8px 0 0" }}>تابع أهم مباريات كرة القدم ومواعيدها.</p>
    </div>
  </a>

  <a href="/leagues" style={{ textDecoration: "none", color: "inherit" }}>
    <div style={{ background: "#142820", padding: "20px", borderRadius: "12px", cursor: "pointer", border: "1px solid #1e3d30" }}>
      <h3>🏆 أهم البطولات</h3>
      <p style={{ fontSize: "14px", color: "#aaa", margin: "8px 0 0" }}>اكتشف أحدث أخبار البطولات العالمية.</p>
    </div>
  </a>

  <a href="/stats" style={{ textDecoration: "none", color: "inherit" }}>
    <div style={{ background: "#142820", padding: "20px", borderRadius: "12px", cursor: "pointer", border: "1px solid #1e3d30" }}>
      <h3>📊 الإحصائيات</h3>
      <p style={{ fontSize: "14px", color: "#aaa", margin: "8px 0 0" }}>إحصائيات وأرقام المباريات والفرق.</p>
    </div>
  </a>
</div>

{/* 📰 2. قسم عرض الأخبار بكثرة مع صورها وعناوينها */}
<section id="news-section" style={{ marginTop: "40px", direction: "rtl" }}>
  <h2 style={{ borderBottom: "2px solid #1e3d30", paddingBottom: "10px", marginBottom: "20px" }}>📰 أحدث الأخبار الرياضية العالمية</h2>
  
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
    
    {/* بطاقة خبر 1 */}
    <div style={{ background: "#142820", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #1e3d30" }}>
      <img src="https://unsplash.com" alt="أخبار الرياضة" style={{ width: "100%", height: "160px", objectFit: "cover" }} />
      <div style={{ padding: "15px" }}>
        <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", lineHeight: "1.4" }}>اشتعال المنافسة في الدوريات الكبرى وسوق الانتقالات يشهد مفاجآت</h4>
        <p style={{ fontSize: "13px", color: "#aaa", margin: "0 0 15px 0" }}>تابع آخر مستجدات الأندية العالمية والتحضيرات للمواجهات القادمة هذا الأسبوع...</p>
        <span style={{ color: "#2ecc71", fontWeight: "bold", fontSize: "14px" }}>التفاصيل كاملة ←</span>
      </div>
    </div>

    {/* بطاقة خبر 2 */}
    <div style={{ background: "#142820", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #1e3d30" }}>
      <img src="https://unsplash.com" alt="أخبار الرياضة" style={{ width: "100%", height: "160px", objectFit: "cover" }} />
      <div style={{ padding: "15px" }}>
        <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", lineHeight: "1.4" }}>تحضيرات مكثفة للأندية الإفريقية والعربية للبطولات القادمة</h4>
        <p style={{ fontSize: "13px", color: "#aaa", margin: "0 0 15px 0" }}>جدول مباريات ناري ينتظر الجماهير العربية مع عودة منافسات دوري الأبطال...</p>
        <span style={{ color: "#2ecc71", fontWeight: "bold", fontSize: "14px" }}>التفاصيل كاملة ←</span>
      </div>
    </div>

    {/* بطاقة خبر 3 */}
    <div style={{ background: "#142820", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #1e3d30" }}>
      <img src="https://unsplash.com" alt="أخبار الرياضة" style={{ width: "100%", height: "160px", objectFit: "cover" }} />
      <div style={{ padding: "15px" }}>
        <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", lineHeight: "1.4" }}>إحصائيات تكشف تفوق النجوم الشباب في الملاعب الأوروبية مؤخراً</h4>
        <p style={{ fontSize: "13px", color: "#aaa", margin: "0 0 15px 0" }}>أرقام قياسية جديدة تتحطم وصدارة الهدافين تشتعل بين أبرز مهاجمي العالم...</p>
        <span style={{ color: "#2ecc71", fontWeight: "bold", fontSize: "14px" }}>التفاصيل كاملة ←</span>
      </div>
    </div>

  </div>

  {/* زر تحميل المزيد ليعطي مظهر كورة لايف المحترف */}
  <div style={{ textAlign: "center", marginTop: "30px" }}>
    <button style={{ background: "#1e3d30", color: "#fff", border: "none", padding: "12px 35px", borderRadius: "25px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>
      🔄 المزيد من الأخبار الرياضية
    </button>
  </div>
</section>


        </div>

      </section>

      <div className="ad">
        مساحة إعلانية
      </div>

      <footer>
        <div className="logo">
          ⚽ Match<span>Zone</span>
        </div>

        <p>
          منصة رياضية عصرية للمباريات والنتائج والأخبار.
        </p>

        <small>
          © 2026 MatchZone
        </small>
      </footer>

    </main>
  );
          }
