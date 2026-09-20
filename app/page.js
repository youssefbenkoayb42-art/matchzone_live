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

const LEAGUE_LOGOS = {
  "premier-league": "https://resources.premierleague.com/premierleague/photos/players/110x140/premier-league-logo.png",
  "la-liga": "https://cdn.simpleicons.org/laliga",
  "serie-a": "https://cdn.simpleicons.org/seriea",
  bundesliga: "https://cdn.simpleicons.org/bundesliga",
  "ligue-1": "https://cdn.simpleicons.org/ligue1",
};

const LEAGUE_FALLBACKS = {
  "premier-league": "🏴",
  "la-liga": "🇪🇸",
  "serie-a": "🇮🇹",
  bundesliga: "🇩🇪",
  "ligue-1": "🇫🇷",
};

function LeagueLogo({ slug, name }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span style={{ fontSize: "20px" }}>{LEAGUE_FALLBACKS[slug] || "⚽"}</span>;
  }
  return (
    <img
      src={LEAGUE_LOGOS[slug]}
      alt={`شعار ${name}`}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
    />
  );
}

function getStatusType(status) {
  const value = String(status || "").toUpperCase();
  if (["LIVE", "1H", "2H", "HT", "ET", "P"].includes(value)) return "live";
  if (["FT", "AET", "PEN", "FINISHED"].includes(value)) return "finished";
  return "upcoming";
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
        const res = await fetch("/api/football", { cache: "no-store" });
        if (!res.ok) throw new Error("فشل الاتصال بمصدر المباريات");
        const data = await res.json();
        setMatches((data.response || []).map(normalizeMatch).filter((match) => match.id));
        setLastUpdated(new Date());
      } catch (error) {
        console.error("خطأ في جلب المباريات:", error);
        setMatchesError("تعذر تحميل المباريات حاليًا. حاول تحديث الصفحة.");
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
        const res = await fetch("/api/news", { cache: "no-store" });
        if (!res.ok) throw new Error("فشل الاتصال بالأخبار");
        const data = await res.json();
        setNews(Array.isArray(data.articles) ? data.articles : []);
      } catch (error) {
        console.error("خطأ في جلب الأخبار:", error);
        setNewsError("تعذر تحميل الأخبار حاليًا.");
      } finally {
        setLoadingNews(false);
      }
    }
    fetchSportsNews();
  }, []);

  const leagues = useMemo(() => ["الكل", ...new Set(matches.map((match) => match.arabicLeague).filter(Boolean))], [matches]);

  const filteredMatches = useMemo(() => matches.filter((match) => {
    const searchValue = search.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      match.home.toLowerCase().includes(searchValue) ||
      match.away.toLowerCase().includes(searchValue) ||
      match.arabicLeague.toLowerCase().includes(searchValue);
    const matchesLeague = selectedLeague === "الكل" || match.arabicLeague === selectedLeague;
    const matchesStatus = selectedStatus === "all" || getStatusType(match.status) === selectedStatus;
    return matchesSearch && matchesLeague && matchesStatus;
  }), [matches, search, selectedLeague, selectedStatus]);

  const liveMatches = filteredMatches.filter((match) => getStatusType(match.status) === "live");
  const featuredMatch =
    liveMatches[0] ||
    filteredMatches.find((match) => getStatusType(match.status) === "upcoming") ||
    filteredMatches[0];

  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #123326 0%, #07100d 38%, #050a08 100%)", color: "#fff", fontFamily: "Arial, Helvetica, sans-serif", paddingBottom: "60px" }}>
      <header style={{ maxWidth: "1250px", margin: "0 auto", padding: "22px 18px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
          <a href="/" style={{ textDecoration: "none", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "15px", background: "linear-gradient(135deg,#2ecc71,#1abc9c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: "0 8px 25px rgba(46,204,113,.2)" }}>⚽</div>
            <div><div style={{ fontSize: "22px", fontWeight: "900" }}>MatchZone</div><div style={{ fontSize: "11px", color: "#718078", marginTop: "2px" }}>عالم كرة القدم بين يديك</div></div>
          </a>
          <nav style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <a href="/" style={{ color: "#2ecc71", background: "rgba(46,204,113,.08)", border: "1px solid rgba(46,204,113,.15)", padding: "9px 15px", borderRadius: "12px", textDecoration: "none", fontSize: "13px", fontWeight: "700" }}>المباريات</a>
            <a href="#news-section" style={{ color: "#b7c1bc", padding: "9px 15px", textDecoration: "none", fontSize: "13px", fontWeight: "700" }}>الأخبار</a>
            <a href="/leagues" style={{ color: "#b7c1bc", padding: "9px 15px", textDecoration: "none", fontSize: "13px", fontWeight: "700" }}>البطولات</a>
          </nav>
        </div>
        <div style={{ marginTop: "28px", position: "relative" }}>
          <span style={{ position: "absolute", right: "18px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", opacity: ".7" }}>🔎</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن فريق أو بطولة..." style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)", color: "#fff", padding: "17px 50px 17px 18px", borderRadius: "16px", outline: "none", fontSize: "14px", direction: "rtl" }} />
        </div>
      </header>

      <div style={{ maxWidth: "1250px", margin: "0 auto", padding: "15px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "12px", marginBottom: "28px" }}>
          {[["إجمالي المباريات", matches.length], ["مباشر الآن", liveMatches.length], ["البطولات", Math.max(leagues.length - 1, 0)]].map(([label, value]) => (
            <div key={label} style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", borderRadius: "18px", padding: "17px" }}>
              <div style={{ color: "#718078", fontSize: "12px", marginBottom: "8px" }}>{label}</div>
              <div style={{ fontSize: "25px", fontWeight: "900" }}>{value}</div>
            </div>
          ))}
          <div style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", borderRadius: "18px", padding: "17px" }}>
            <div style={{ color: "#718078", fontSize: "12px", marginBottom: "8px" }}>آخر تحديث</div>
            <div style={{ fontSize: "14px", fontWeight: "800", marginTop: "9px" }}>{lastUpdated ? lastUpdated.toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</div>
          </div>
        </div>

        <section aria-labelledby="popular-leagues" style={{ marginBottom: "32px", padding: "22px", borderRadius: "22px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div><h2 id="popular-leagues" style={{ margin: 0, fontSize: "20px", fontWeight: "900" }}>🏆 أهم بطولات كرة القدم</h2><p style={{ margin: "7px 0 0", color: "#718078", fontSize: "12px" }}>مباريات اليوم والنتائج والمواعيد لأشهر الدوريات.</p></div>
            <a href="/leagues" style={{ color: "#2ecc71", textDecoration: "none", fontSize: "12px", fontWeight: "900" }}>جميع البطولات ←</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "10px" }}>
            {[
              ["premier-league", "الدوري الإنجليزي"],
              ["la-liga", "الدوري الإسباني"],
              ["serie-a", "الدوري الإيطالي"],
              ["bundesliga", "الدوري الألماني"],
              ["ligue-1", "الدوري الفرنسي"],
            ].map(([slug, name]) => (
              <a key={slug} href={`/leagues/${slug}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", minHeight: "62px", padding: "10px 12px", borderRadius: "14px", background: "linear-gradient(145deg,rgba(46,204,113,.08),rgba(255,255,255,.025))", border: "1px solid rgba(46,204,113,.12)", color: "#dce7e1", textDecoration: "none", textAlign: "center", fontSize: "12px", fontWeight: "800", boxShadow: "0 8px 20px rgba(0,0,0,.12)" }}>
                <span style={{ width: "36px", height: "36px", minWidth: "36px", borderRadius: "10px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "5px", boxSizing: "border-box" }}>
                  <LeagueLogo slug={slug} name={name} />
                </span>
                <span>{name}</span>
              </a>
            ))}
          </div>
          <a href="/matches/today" style={{ display: "block", marginTop: "12px", padding: "13px", borderRadius: "14px", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.06)", color: "#cbd5d0", textDecoration: "none", textAlign: "center", fontSize: "12px", fontWeight: "900" }}>📅 عرض جميع مباريات اليوم</a>
        </section>

        {featuredMatch && (
          <section style={{ marginBottom: "32px", padding: "22px", borderRadius: "22px", background: "linear-gradient(145deg,rgba(46,204,113,.09),rgba(255,255,255,.025))", border: "1px solid rgba(46,204,113,.13)" }}>
            <div style={{ color: "#2ecc71", fontSize: "12px", fontWeight: "900", marginBottom: "15px" }}>{getStatusType(featuredMatch.status) === "live" ? "🔴 مباشر الآن" : "⭐ أبرز مباراة"}</div>
            <div style={{ display: "flex", flexDirection: "row", flexWrap: "nowrap", alignItems: "center", justifyContent: "center", direction: "ltr", gap: "10px" }}>
              {[["home", featuredMatch.home, featuredMatch.homeLogo], ["away", featuredMatch.away, featuredMatch.awayLogo]].map(([side, team, logo]) => (
                <div key={side} style={{ flex: "1 1 0", width: 0, minWidth: 0, textAlign: "center" }}>
                  {logo ? <img src={logo} alt={team} style={{ width: "62px", height: "62px", objectFit: "contain", display: "block", margin: "0 auto 8px" }} /> : <div style={{ height: "62px" }} />}
                  <div style={{ fontSize: "12px", fontWeight: "800", color: "#dce7e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team}</div>
                </div>
              ))}
              <div style={{ flex: "0 0 auto", minWidth: "92px", textAlign: "center" }}>
                <div style={{ color: getStatusType(featuredMatch.status) === "live" ? "#ff4d4d" : "#2ecc71", fontSize: "11px", fontWeight: "900", marginBottom: "8px" }}>{featuredMatch.status}</div>
                <div style={{ fontSize: "30px", fontWeight: "900" }}>{featuredMatch.homeScore ?? "-"} - {featuredMatch.awayScore ?? "-"}</div>
                <div style={{ color: "#718078", fontSize: "10px", marginTop: "5px" }}>{featuredMatch.time}</div>
              </div>
            </div>
            <a href={`/matches/${featuredMatch.id}`} style={{ display: "block", marginTop: "18px", textAlign: "center", textDecoration: "none", color: "#2ecc71", background: "rgba(46,204,113,.06)", border: "1px solid rgba(46,204,113,.12)", padding: "11px", borderRadius: "12px", fontSize: "11px", fontWeight: "900" }}>عرض تفاصيل المباراة ←</a>
          </section>
        )}

        <section id="matches-section" style={{ marginTop: "15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "15px", marginBottom: "18px", flexWrap: "wrap" }}>
            <div><h1 style={{ margin: 0, fontSize: "25px", fontWeight: "900" }}>🗓️ مباريات اليوم ونتائج كرة القدم</h1><div style={{ color: "#718078", fontSize: "12px", marginTop: "7px" }}>مباريات مباشرة ونتائج ومواعيد أهم البطولات.</div></div>
            <div style={{ color: "#2ecc71", fontSize: "11px", fontWeight: "800" }}>⚡ تحديث تلقائي</div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
            {[
              ["all", "الكل"], ["live", "مباشر"], ["upcoming", "قادمة"], ["finished", "منتهية"]
            ].map(([value, label]) => (
              <button key={value} onClick={() => setSelectedStatus(value)} style={{ border: selectedStatus === value ? "1px solid rgba(46,204,113,.35)" : "1px solid rgba(255,255,255,.08)", background: selectedStatus === value ? "rgba(46,204,113,.11)" : "rgba(255,255,255,.025)", color: selectedStatus === value ? "#2ecc71" : "#aab5af", padding: "9px 13px", borderRadius: "10px", cursor: "pointer", fontSize: "11px", fontWeight: "800" }}>{label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "5px", marginBottom: "20px" }}>
            {leagues.map((league) => (
              <button key={league} onClick={() => setSelectedLeague(league)} style={{ flex: "0 0 auto", border: selectedLeague === league ? "1px solid rgba(46,204,113,.35)" : "1px solid rgba(255,255,255,.08)", background: selectedLeague === league ? "rgba(46,204,113,.11)" : "rgba(255,255,255,.025)", color: selectedLeague === league ? "#2ecc71" : "#aab5af", padding: "9px 13px", borderRadius: "10px", cursor: "pointer", fontSize: "11px", fontWeight: "800" }}>{league}</button>
            ))}
          </div>

          {matchesError && <div style={{ padding: "20px", borderRadius: "18px", background: "rgba(255,77,77,.06)", border: "1px solid rgba(255,77,77,.15)", color: "#ff8a8a", textAlign: "center", marginBottom: "20px" }}>⚠️ {matchesError}</div>}

          {loadingMatches && <div style={{ padding: "45px 20px", borderRadius: "20px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", textAlign: "center", color: "#718078" }}>⏳ جارٍ تحميل المباريات...</div>}

          {!loadingMatches && !matchesError && filteredMatches.length === 0 && <div style={{ padding: "45px 20px", borderRadius: "20px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", textAlign: "center", color: "#718078" }}>⚽ لا توجد مباريات مطابقة حاليًا.</div>}

          {!loadingMatches && filteredMatches.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "15px" }}>
              {filteredMatches.map((match) => (
                <article key={match.id} style={{ padding: "18px", borderRadius: "20px", background: "linear-gradient(145deg,rgba(255,255,255,.04),rgba(255,255,255,.018))", border: "1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
                    <span style={{ color: "#2ecc71", fontSize: "10px", fontWeight: "900" }}>{match.arabicLeague}</span>
                    <span style={{ color: getStatusType(match.status) === "live" ? "#ff4d4d" : "#8b9892", fontSize: "10px", fontWeight: "900" }}>{match.status}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "10px", direction: "ltr" }}>
                    <div style={{ textAlign: "center", minWidth: 0 }}><img src={match.homeLogo || "/logo.png"} alt={match.home} style={{ width: "48px", height: "48px", objectFit: "contain", margin: "0 auto 8px", display: "block" }} /><div style={{ fontSize: "11px", fontWeight: "800", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{match.home}</div></div>
                    <div style={{ textAlign: "center", minWidth: "65px" }}><div style={{ fontSize: "22px", fontWeight: "900" }}>{match.homeScore ?? "-"} - {match.awayScore ?? "-"}</div><div style={{ color: "#718078", fontSize: "10px", marginTop: "4px" }}>{match.time}</div></div>
                    <div style={{ textAlign: "center", minWidth: 0 }}><img src={match.awayLogo || "/logo.png"} alt={match.away} style={{ width: "48px", height: "48px", objectFit: "contain", margin: "0 auto 8px", display: "block" }} /><div style={{ fontSize: "11px", fontWeight: "800", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{match.away}</div></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "20px" }}>
                    <a href={`/teams/${encodeURIComponent(match.home)}`} style={{ display: "block", textAlign: "center", textDecoration: "none", color: "#2ecc71", background: "rgba(46,204,113,.06)", border: "1px solid rgba(46,204,113,.12)", padding: "11px 7px", borderRadius: "11px", fontSize: "10px", fontWeight: "800" }}>{match.home}</a>
                    <a href={`/teams/${encodeURIComponent(match.away)}`} style={{ display: "block", textAlign: "center", textDecoration: "none", color: "#2ecc71", background: "rgba(46,204,113,.06)", border: "1px solid rgba(46,204,113,.12)", padding: "11px 7px", borderRadius: "11px", fontSize: "10px", fontWeight: "800" }}>{match.away}</a>
                  </div>
                  <a href={`/matches/${match.id}`} style={{ display: "block", marginTop: "10px", textAlign: "center", textDecoration: "none", color: "#cbd5d0", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.06)", padding: "11px", borderRadius: "11px", fontSize: "11px", fontWeight: "800" }}>تفاصيل المباراة ←</a>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="news-section" style={{ marginTop: "55px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "15px", marginBottom: "22px", flexWrap: "wrap" }}>
            <div><div style={{ fontSize: "22px", fontWeight: "900" }}>📰 آخر الأخبار الرياضية</div><div style={{ color: "#718078", fontSize: "12px", marginTop: "7px" }}>أحدث الأخبار والمستجدات الرياضية</div></div>
            <div style={{ color: "#2ecc71", fontSize: "12px", fontWeight: "800" }}>⚡ تحديث مستمر</div>
          </div>
          {newsError && <div style={{ padding: "20px", borderRadius: "18px", background: "rgba(255,77,77,.06)", border: "1px solid rgba(255,77,77,.15)", color: "#ff8a8a", textAlign: "center", marginBottom: "20px" }}>⚠️ {newsError}</div>}
          {loadingNews && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px" }}>{[1,2,3].map((item) => <div key={item} style={{ height: "310px", borderRadius: "20px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.05)" }} />)}</div>}
          {!loadingNews && news.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "18px" }}>
              {news.slice(0, visibleNews).map((article, index) => {
                const image = article.image || article.urlToImage || null;
                const title = article.title || "خبر رياضي جديد";
                const description = article.description || "تابع أحدث التفاصيل والمستجدات الرياضية عبر MatchZone.";
                const source = article.source?.name || article.source || "MatchZone";
                const published = article.publishedAt || article.published_at || null;
                return (
                  <article key={article.url || `${title}-${index}`} style={{ overflow: "hidden", borderRadius: "20px", background: "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))", border: "1px solid rgba(255,255,255,.06)", boxShadow: "0 15px 35px rgba(0,0,0,.2)" }}>
                    <div style={{ width: "100%", height: "175px", overflow: "hidden", background: "linear-gradient(135deg,#123326,#07100d)" }}>
                      {image ? <img src={image} alt={title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px" }}>📰</div>}
                    </div>
                    <div style={{ padding: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "12px" }}><span style={{ color: "#2ecc71", fontSize: "10px", fontWeight: "900" }}>📰 {source}</span>{published && <span style={{ color: "#68756f", fontSize: "10px" }}>{new Date(published).toLocaleDateString("ar-MA")}</span>}</div>
                      <h3 style={{ margin: "0 0 10px", fontSize: "15px", lineHeight: "1.65", fontWeight: "900", color: "#fff" }}>{title}</h3>
                      <p style={{ margin: "0 0 18px", color: "#819088", fontSize: "12px", lineHeight: "1.7" }}>{description.length > 120 ? `${description.slice(0,120)}...` : description}</p>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: "#2ecc71", background: "rgba(46,204,113,.07)", border: "1px solid rgba(46,204,113,.1)", padding: "10px 13px", borderRadius: "11px", fontSize: "11px", fontWeight: "900" }}><span>قراءة الخبر</span><span>←</span></a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {!loadingNews && !newsError && news.length === 0 && <div style={{ padding: "45px 20px", borderRadius: "20px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", textAlign: "center" }}><div style={{ fontSize: "42px", marginBottom: "12px" }}>📰</div><div style={{ fontSize: "16px", fontWeight: "900", marginBottom: "7px" }}>لا توجد أخبار حاليًا</div><div style={{ color: "#718078", fontSize: "12px" }}>سنعرض الأخبار فور توفرها.</div></div>}
        </section>

        <footer style={{ marginTop: "65px", padding: "30px 0 15px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <div><div style={{ fontSize: "18px", fontWeight: "900" }}>⚽ MatchZone</div><div style={{ color: "#68756f", fontSize: "11px", marginTop: "6px" }}>منصة عصرية للمباريات والنتائج والأخبار الرياضية.</div></div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}><a href="#matches-section" style={{ color: "#87948e", textDecoration: "none", fontSize: "11px" }}>المباريات</a><a href="#news-section" style={{ color: "#87948e", textDecoration: "none", fontSize: "11px" }}>الأخبار</a><a href="#" style={{ color: "#87948e", textDecoration: "none", fontSize: "11px" }}>العودة للأعلى ↑</a></div>
          </div>
          <div style={{ textAlign: "center", marginTop: "30px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,.04)", color: "#4f5b56", fontSize: "10px" }}>© 2026 MatchZone — جميع الحقوق محفوظة</div>
        </footer>
      </div>
    </main>
  );
}
