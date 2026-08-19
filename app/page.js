"use client";
import { useState, useEffect } from "react";


const leagues = [
  "الدوري الإسباني",
  "الدوري الإنجليزي",
  "دوري أبطال أوروبا",
  "الدوري الإيطالي"
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("الكل");
  const [matches, setMatches] = useState([]);
  useEffect(() => {
  fetch("/api/football")
    .then((res) => res.json())
    .then((data) => {
      const formattedMatches = data.response.map((item) => ({
  time: new Date(item.fixture.date).toLocaleTimeString("ar-MA", {
    hour: "2-digit",
    minute: "2-digit",
  }),
  home: item.teams.home.name,
  homeLogo: item.teams.home.logo,
  away: item.teams.away.name,
  awayLogo: item.teams.away.logo,
  status: item.fixture.status.short,
  league: item.league.name,
}));

setMatches(formattedMatches);
})
.catch((error) => {
  console.error("خطأ في جلب المباريات:", error);
});
}, []);
      

  const filteredMatches = matches.filter((match) => {
  const matchesSearch =
    match.home.includes(search) ||
    match.away.includes(search);

  const matchesLeague =
    selectedLeague === "الكل" ||
    match.league === selectedLeague;

  return matchesSearch && matchesLeague;
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
  {leagues.map((league, index) => (
    <option key={index} value={league}>
      {league}
    </option>
  ))}
</select>
          
        </div>

        <div className="matches">
          {filteredMatches.map((match, index) => (
            <div className="match" key={index}>

  <div className="competition">
    🏆 {match.league}
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

      <strong>{match.time}</strong>

      <span
        className={
          match.status === "LIVE"
            ? "live-status"
            : "match-status"
        }
      >
        {match.status === "LIVE"
          ? "🔴 مباشر"
          : match.status === "FT"
          ? "انتهت"
          : match.status === "NS"
          ? "لم تبدأ"
          : match.status}
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

  <button className="details">
    تفاصيل المباراة
  </button>

</div>
          ))}
        </div>
      </section>

      <section id="leagues" className="section">

        <div className="section-title">
          <div>
            <p className="tag">LEAGUES</p>
            <h2>أشهر البطولات</h2>
          </div>
        </div>

        <div className="league-grid">
          {leagues.map((league, index) => (
            <div className="league" key={index}>
              <div className="league-icon">🏆</div>
              <strong>{league}</strong>
              <small>المباريات والنتائج</small>
            </div>
          ))}
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
