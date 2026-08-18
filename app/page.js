"use client";
const matches = [
  { time: "18:00", home: "ريال مدريد", away: "برشلونة", status: "لم تبدأ" },
  { time: "20:30", home: "ليفربول", away: "مانشستر سيتي", status: "لم تبدأ" },
  { time: "22:00", home: "بايرن ميونخ", away: "بوروسيا دورتموند", status: "لم تبدأ" }
];

const leagues = [
  "الدوري الإسباني",
  "الدوري الإنجليزي",
  "دوري أبطال أوروبا",
  "الدوري الإيطالي"
];

export default function Home() {
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

        <button className="search">⌕ بحث</button>
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

          <button className="filter">
            جميع البطولات ▾
          </button>
        </div>

        <div className="matches">
          {matches.map((match, index) => (
            <div className="match" key={index}>

              <div className="competition">
                ⚡ مباراة اليوم
              </div>

              <div className="teams">

                <div className="team">
                  <div className="team-logo">⚽</div>
                  <strong>{match.home}</strong>
                </div>

                <div className="match-time">
                  <strong>{match.time}</strong>
                  <span>{match.status}</span>
                </div>

                <div className="team">
                  <div className="team-logo">⚽</div>
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
