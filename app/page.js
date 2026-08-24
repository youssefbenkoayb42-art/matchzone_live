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

          <h1>
            كل المباريات
            <br />
            <span>في مكان واحد.</span>
          </h1>

          <p className="description">
            تابع المباريات والنتائج والبطولات في منصة رياضية
            عصرية وسريعة ومصممة خصيصًا لعشاق كرة القدم.
          </p>

          <a href="#matches" className="button">
            مباريات اليوم →
          </a>
        </div>

        <div className="hero-card">
          <div className="live">● مباشر</div>
          <div className="score">2 — 1</div>
          <p>MatchZone Live</p>
          <small>تحديثات المباراة لحظة بلحظة</small>
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

          {filteredMatches.map((match) => {
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

          <article>
            <div className="news-image">📊</div>
            <h3>الإحصائيات</h3>
            <p>
              إحصائيات وأرقام المباريات والفرق.
            </p>
          </article>

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
