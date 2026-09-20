"use client";

import { useEffect, useMemo, useState } from "react";

const BASE_LEAGUES = [
  ["premier-league", "الدوري الإنجليزي"],
  ["la-liga", "الدوري الإسباني"],
  ["serie-a", "الدوري الإيطالي"],
  ["bundesliga", "الدوري الألماني"],
  ["ligue-1", "الدوري الفرنسي"],
];

const LEAGUE_LOGOS = {
  "premier-league": "/leagues/premier-league.svg",
  "la-liga": "/leagues/la-liga.svg",
  "serie-a": "/leagues/serie-a.svg",
  bundesliga: "/leagues/bundesliga.svg",
  "ligue-1": "/leagues/ligue-1.svg",
};

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

function TeamLogo({ src, alt, size = 48 }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className="team-logo-fallback" style={{ width: size, height: size }} aria-label={alt}>⚽</div>;
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="team-logo-img"
      style={{ width: size, height: size }}
    />
  );
}

function LeagueLogo({ slug, name }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="league-fallback">⚽</span>;
  return (
    <img
      src={LEAGUE_LOGOS[slug]}
      alt={`شعار ${name}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="league-logo-img"
    />
  );
}

function getStatusType(status) {
  const value = String(status || "").toUpperCase();
  if (["LIVE", "1H", "2H", "HT", "ET", "P"].includes(value)) return "live";
  if (["FT", "AET", "PEN", "FINISHED"].includes(value)) return "finished";
  return "upcoming";
}

function getStatusLabel(status) {
  const type = getStatusType(status);
  if (type === "live") return "مباشر";
  if (type === "finished") return "انتهت";
  return "قادمة";
}

function formatTime(date) {
  if (!date) return "--:--";
  try {
    return new Date(date).toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" });
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
    homeScore: item?.goals?.home !== undefined ? item.goals.home : null,
    awayScore: item?.goals?.away !== undefined ? item.goals.away : null,
    league: item?.league?.name || "Football",
    arabicLeague: getArabicLeague(item?.league?.name),
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
  const [refreshing, setRefreshing] = useState(false);

  async function fetchMatches(showLoader = true) {
    try {
      if (showLoader) setLoadingMatches(true);
      setMatchesError("");
      const res = await fetch("/api/football", { cache: "no-store" });
      if (!res.ok) throw new Error("matches");
      const data = await res.json();
      setMatches((data.response || []).map(normalizeMatch).filter((match) => match.id));
      setLastUpdated(new Date());
    } catch {
      setMatchesError("تعذر تحميل المباريات حاليًا. حاول مرة أخرى.");
    } finally {
      setLoadingMatches(false);
    }
  }

  async function fetchSportsNews() {
    try {
      setLoadingNews(true);
      setNewsError("");
      const res = await fetch("/api/news", { cache: "no-store" });
      if (!res.ok) throw new Error("news");
      const data = await res.json();
      setNews(Array.isArray(data.articles) ? data.articles : []);
    } catch {
      setNewsError("تعذر تحميل الأخبار حاليًا.");
    } finally {
      setLoadingNews(false);
    }
  }

  useEffect(() => {
    fetchMatches();
    fetchSportsNews();
    const timer = setInterval(() => fetchMatches(false), 60000);
    return () => clearInterval(timer);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchMatches(false);
    setRefreshing(false);
  }

  const leagues = useMemo(
    () => ["الكل", ...new Set(matches.map((match) => match.arabicLeague).filter(Boolean))],
    [matches]
  );

  const filteredMatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return matches.filter((match) => {
      const matchesSearch =
        !query ||
        match.home.toLowerCase().includes(query) ||
        match.away.toLowerCase().includes(query) ||
        match.arabicLeague.toLowerCase().includes(query);
      const matchesLeague = selectedLeague === "الكل" || match.arabicLeague === selectedLeague;
      const matchesStatus = selectedStatus === "all" || getStatusType(match.status) === selectedStatus;
      return matchesSearch && matchesLeague && matchesStatus;
    });
  }, [matches, search, selectedLeague, selectedStatus]);

  const liveMatches = matches.filter((match) => getStatusType(match.status) === "live");
  const featuredMatch =
    liveMatches[0] ||
    matches.find((match) => getStatusType(match.status) === "upcoming") ||
    matches[0];

  return (
    <main className="mz-home" dir="rtl">
      <header className="mz-header">
        <div className="mz-header-inner">
          <a href="/" className="mz-brand" aria-label="MatchZone">
            <img src="/logo.svg" alt="MatchZone" className="mz-brand-logo" />
            <span>
              <strong>MatchZone</strong>
              <small>كرة القدم كما تحبها</small>
            </span>
          </a>

          <nav className="mz-nav">
            <a className="active" href="#matches-section">المباريات</a>
            <a href="/leagues">البطولات</a>
            <a href="#news-section">الأخبار</a>
          </nav>

          <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing} aria-label="تحديث المباريات">
            {refreshing ? "⏳" : "↻"} <span>تحديث</span>
          </button>
        </div>
      </header>

      <div className="mz-container">
        <section className="mz-hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse-dot" /> LIVE FOOTBALL</div>
            <h1>كل مباريات اليوم<br /><span>في مكان واحد.</span></h1>
            <p>نتائج مباشرة، مواعيد المباريات، أهم البطولات وآخر الأخبار الرياضية — بتجربة سريعة ومصممة للهاتف.</p>
            <div className="hero-actions">
              <a href="#matches-section" className="primary-btn">استكشف المباريات <span>←</span></a>
              <a href="/leagues" className="ghost-btn">استعرض البطولات</a>
            </div>
          </div>

          {featuredMatch ? (
            <div className="hero-match">
              <div className="hero-match-top">
                <span>{getStatusType(featuredMatch.status) === "live" ? "🔴 مباشر الآن" : "⭐ أبرز مباراة"}</span>
                <small>{featuredMatch.arabicLeague}</small>
              </div>
              <div className="hero-teams">
                <div>
                  <TeamLogo src={featuredMatch.homeLogo} alt={featuredMatch.home} size={58} />
                  <strong>{featuredMatch.home}</strong>
                </div>
                <div className="hero-score">
                  <span className={getStatusType(featuredMatch.status) === "live" ? "score-live" : ""}>{featuredMatch.homeScore ?? "-"}</span>
                  <b>-</b>
                  <span>{featuredMatch.awayScore ?? "-"}</span>
                  <small>{featuredMatch.time}</small>
                </div>
                <div>
                  <TeamLogo src={featuredMatch.awayLogo} alt={featuredMatch.away} size={58} />
                  <strong>{featuredMatch.away}</strong>
                </div>
              </div>
              <a href={`/matches/${featuredMatch.id}`} className="hero-details">تفاصيل المباراة <span>←</span></a>
            </div>
          ) : (
            <div className="hero-match empty-hero"><span>⚽</span><strong>المباريات قيد التحميل</strong></div>
          )}
        </section>

        <section className="quick-stats">
          <div><span>المباريات</span><strong>{matches.length}</strong><small>اليوم</small></div>
          <div><span>مباشر الآن</span><strong className="green">{liveMatches.length}</strong><small>تحديث تلقائي</small></div>
          <div><span>البطولات</span><strong>{Math.max(leagues.length - 1, 0)}</strong><small>متاحة الآن</small></div>
          <div><span>آخر تحديث</span><strong>{lastUpdated ? lastUpdated.toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</strong><small>يتجدد كل دقيقة</small></div>
        </section>

        <section className="league-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">TOP LEAGUES</span>
              <h2>أهم البطولات</h2>
              <p>تابع أشهر الدوريات الأوروبية في لحظة.</p>
            </div>
            <a href="/leagues">كل البطولات ←</a>
          </div>
          <div className="league-strip">
            {BASE_LEAGUES.map(([slug, name]) => (
              <a href={`/leagues/${slug}`} key={slug} className="league-card">
                <span className="league-icon-wrap"><LeagueLogo slug={slug} name={name} /></span>
                <strong>{name}</strong>
                <span className="league-arrow">←</span>
              </a>
            ))}
          </div>
        </section>

        <section id="matches-section" className="matches-section">
          <div className="section-heading matches-heading">
            <div>
              <span className="section-kicker">TODAY</span>
              <h2>مباريات اليوم</h2>
              <p>المواعيد والنتائج والحالات بشكل واضح وسريع.</p>
            </div>
            <a href="/matches/today">صفحة اليوم ←</a>
          </div>

          <div className="search-box">
            <span>⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن فريق أو بطولة..." aria-label="البحث عن مباراة" />
            {search && <button onClick={() => setSearch("")} aria-label="مسح البحث">×</button>}
          </div>

          <div className="filter-row status-row">
            {[["all", "الكل"], ["live", "🔴 مباشر"], ["upcoming", "قادمة"], ["finished", "منتهية"]].map(([value, label]) => (
              <button key={value} className={selectedStatus === value ? "filter-pill selected" : "filter-pill"} onClick={() => setSelectedStatus(value)}>{label}</button>
            ))}
          </div>

          <div className="filter-row league-filter">
            {leagues.map((league) => (
              <button key={league} className={selectedLeague === league ? "filter-pill selected" : "filter-pill"} onClick={() => setSelectedLeague(league)}>{league}</button>
            ))}
          </div>

          {matchesError && <div className="state-box error">⚠️ {matchesError}</div>}
          {loadingMatches && <div className="state-box">⏳ جارٍ تحميل مباريات اليوم...</div>}
          {!loadingMatches && !matchesError && filteredMatches.length === 0 && (
            <div className="state-box empty-state"><span>⚽</span><strong>لا توجد مباريات مطابقة</strong><small>جرّب تغيير الفلتر أو البحث.</small></div>
          )}

          {!loadingMatches && filteredMatches.length > 0 && (
            <div className="match-grid">
              {filteredMatches.map((match) => {
                const live = getStatusType(match.status) === "live";
                return (
                  <article key={match.id} className={live ? "match-card live-card" : "match-card"}>
                    <div className="match-meta">
                      <span>{match.arabicLeague}</span>
                      <b className={live ? "live-label" : ""}>{live ? "● مباشر" : getStatusLabel(match.status)}</b>
                    </div>
                    <div className="match-teams">
                      <a href={`/teams/${encodeURIComponent(match.home)}`} className="match-team">
                        <TeamLogo src={match.homeLogo} alt={match.home} size={48} />
                        <strong>{match.home}</strong>
                      </a>
                      <div className="match-center">
                        <strong>{match.homeScore ?? "-"} - {match.awayScore ?? "-"}</strong>
                        <span>{match.time}</span>
                      </div>
                      <a href={`/teams/${encodeURIComponent(match.away)}`} className="match-team">
                        <TeamLogo src={match.awayLogo} alt={match.away} size={48} />
                        <strong>{match.away}</strong>
                      </a>
                    </div>
                    <a href={`/matches/${match.id}`} className="match-details">تفاصيل المباراة <span>←</span></a>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section id="news-section" className="news-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">SPORTS NEWS</span>
              <h2>آخر الأخبار الرياضية</h2>
              <p>مستجدات مختارة لتبقى قريبًا من عالم الكرة.</p>
            </div>
          </div>

          {newsError && <div className="state-box error">⚠️ {newsError}</div>}
          {loadingNews && <div className="news-grid">{[1, 2, 3].map((item) => <div className="news-skeleton" key={item} />)}</div>}
          {!loadingNews && news.length > 0 && (
            <>
              <div className="news-grid">
                {news.slice(0, visibleNews).map((article, index) => {
                  const image = article.image || article.urlToImage || null;
                  const title = article.title || "خبر رياضي جديد";
                  const description = article.description || "تابع أحدث المستجدات الرياضية عبر MatchZone.";
                  const source = article.source?.name || article.source || "MatchZone";
                  const published = article.publishedAt || article.published_at || null;
                  return (
                    <article className="news-card" key={article.url || `${title}-${index}`}>
                      <div className="news-cover">
                        {image ? <img src={image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <span>📰</span>}
                      </div>
                      <div className="news-body">
                        <div className="news-source"><span>📰 {source}</span>{published && <time>{new Date(published).toLocaleDateString("ar-MA")}</time>}</div>
                        <h3>{title}</h3>
                        <p>{description.length > 105 ? `${description.slice(0, 105)}...` : description}</p>
                        {article.url && <a href={article.url} target="_blank" rel="noopener noreferrer">قراءة الخبر <span>↗</span></a>}
                      </div>
                    </article>
                  );
                })}
              </div>
              {news.length > visibleNews && <button className="load-more" onClick={() => setVisibleNews((value) => value + 6)}>عرض المزيد من الأخبار</button>}
            </>
          )}
          {!loadingNews && !newsError && news.length === 0 && <div className="state-box empty-state"><span>📰</span><strong>لا توجد أخبار حاليًا</strong><small>سنضيف الأخبار فور توفرها.</small></div>}
        </section>

        <footer className="mz-footer">
          <div>
            <a href="/" className="footer-brand"><img src="/logo.svg" alt="" /> MatchZone</a>
            <p>منصة عصرية للمباريات والنتائج والأخبار الرياضية.</p>
          </div>
          <div className="footer-links">
            <a href="/matches/today">مباريات اليوم</a>
            <a href="/leagues">البطولات</a>
            <a href="#news-section">الأخبار</a>
            <a href="#matches-section">↑ الأعلى</a>
          </div>
          <div className="copyright">© 2026 MatchZone</div>
        </footer>
      </div>

      <nav className="mobile-nav">
        <a className="active" href="#matches-section"><span>⚽</span>المباريات</a>
        <a href="/leagues"><span>🏆</span>البطولات</a>
        <a href="#news-section"><span>📰</span>الأخبار</a>
        <a href="/matches/today"><span>📅</span>اليوم</a>
      </nav>
    </main>
  );
}
