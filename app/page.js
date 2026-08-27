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
      selectedLeague === "الكل" || match.arabicLeague === selectedLeague;
    const statusType = getStatusType(match.status);
    const matchesStatus =
      selectedStatus === "all" || statusType === selectedStatus;

    return matchesSearch && matchesLeague && matchesStatus;
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    const statusOrder = { live: 1, upcoming: 2, finished: 3 };
    const statusA = getStatusType(a.status);
    const statusB = getStatusType(b.status);
    const orderDifference = statusOrder[statusA] - statusOrder[statusB];
    if (orderDifference !== 0) return orderDifference;
    return a.time.localeCompare(b.time, "ar-MA");
  });

  const liveMatches = sortedMatches.filter((match) => getStatusType(match.status) === "live");
  const upcomingMatches = sortedMatches.filter((match) => getStatusType(match.status) === "upcoming");
  const finishedMatches = sortedMatches.filter((match) => getStatusType(match.status) === "finished");

  const featuredMatch = liveMatches[0] || upcomingMatches[0] || finishedMatches[0] || null;

  return (
    <main style={{ 
      background: "radial-gradient(circle at top, #0f2b1d 0%, #06100b 100%)", 
      minHeight: "100vh", 
      color: "#fff", 
      padding: "25px 15px", 
      fontFamily: "system-ui, -apple-system, sans-serif", 
      direction: "rtl" 
    }}>
      
      {/* هيدر تكتيكي فاخر */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        flexWrap: "wrap", 
        gap: "15px",
        marginBottom: "40px",
        paddingBottom: "20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)"
      }}>
        <div style={{ fontSize: "28px", fontWeight: "900", background: "linear-gradient(135deg, #2ecc71, #a3e635)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          ⚽ Match<span style={{ color: "#fff", WebkitTextFillColor: "#fff" }}>Zone</span>
        </div>

        <nav style={{ display: "flex", gap: "20px" }}>
          <a href="#matches" style={{ color: "#aaa", textDecoration: "none", fontWeight: "bold" }}>المباريات</a>
          <a href="/leagues" style={{ color: "#aaa", textDecoration: "none", fontWeight: "bold" }}>البطولات</a>
          <a href="#news-section" style={{ color: "#aaa", textDecoration: "none", fontWeight: "bold" }}>الأخبار</a>
        </nav>

        <input
          style={{ 
            background: "rgba(255,255,255,0.05)", 
            border: "1px solid rgba(46,204,113,0.2)", 
            padding: "10px 20px", 
            borderRadius: "30px", 
            color: "#fff", 
            outline: "none", 
            width: "200px" 
          }}
          type="text"
          placeholder="⌕ بحث عن فريق..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      {/* 🚀 بطاقة مباراة الواجهة الفخمة والزجاجية (Hero Card) */}
      {featuredMatch && (
        <section style={{ 
          background: "rgba(255, 255, 255, 0.03)", 
          backdropFilter: "blur(20px)", 
          borderRadius: "24px", 
          padding: "30px 20px", 
          marginBottom: "40px", 
          border: "1px solid rgba(46, 204, 113, 0.15)", 
          boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
          textAlign: "center" 
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(226, 55, 55, 0.15)", color: "#ff4d4d", padding: "6px 16px", borderRadius: "30px", fontSize: "13px", fontWeight: "bold" }}>
            {getStatusType(featuredMatch.status) === "live" ? "🔴 مباشر الآن" : getStatusType(featuredMatch.status) === "upcoming" ? "⏰ المباراة القادمة" : "✅ آخر نتيجة"}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", margin: "25px 0" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              {featuredMatch.homeLogo && <img src={featuredMatch.homeLogo} alt={featuredMatch.home} style={{ width: "65px", height: "65px", objectFit: "contain" }} />}
              <h3 style={{ fontSize: "16px", marginTop: "12px" }}>{featuredMatch.home}</h3>
            </div>

            <div style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontSize: "44px", fontWeight: "900", color: "#2ecc71", textShadow: "0 0 20px rgba(46,204,113,0.4)" }}>
                {getStatusType(featuredMatch.status) === "upcoming" ? featuredMatch.time : `${featuredMatch.homeScore ?? 0} — ${featuredMatch.awayScore ?? 0}`}
              </span>
            </div>

            <div style={{ flex: 1, textAlign: "center" }}>
              {featuredMatch.awayLogo && <img src={featuredMatch.awayLogo} alt={featuredMatch.away} style={{ width: "65px", height: "65px", objectFit: "contain" }} />}
              <h3 style={{ fontSize: "16px", marginTop: "12px" }}>{featuredMatch.away}</h3>
            </div>
          </div>

          <span style={{ color: "#95a5a6", fontSize: "13px" }}>🏆 {featuredMatch.arabicLeague}</span>
        </section>
      )}

      {/* 🧩 أزرار التنقل ثلاثية الأبعاد السريعة للشبكة */}
      <nav style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "50px" }}>
        <a href="#matches" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#2ecc71" }}>⚽ مباريات اليوم</h3>
            <p style={{ fontSize: "13px", color: "#95a5a6", margin: 0 }}>مواعيد اللقاءات الحية وجداول الليلة الفورية.</p>
          </div>
        </a>
        <a href="/leagues" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#2ecc71" }}>🏆 أهم البطولات</h3>
            <p style={{ fontSize: "13px", color: "#95a5a6", margin: 0 }}>عرض جداول النقاط والترتيب للأندية دقيقة بدقيقة.</p>
          </div>
        </a>
        <a href="/stats" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#2ecc71" }}>📊 الإحصائيات الحية</h3>
            <p style={{ fontSize: "13px", color: "#95a5a6", margin: 0 }}>صدارة الهدافين وصناع اللعب الحقيقية مباشرة.</p>
          </div>
        </a>
      </nav>

      {/* 📅 جدول المباريات الأساسي مع الفلاتر الذكية */}
      <section id="matches" style={{ marginBottom: "50px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" }}>
          <h2>🗓️ جدول مباريات اليوم</h2>
          <select
            style={{ background: "#142820", color: "#fff", border: "1px solid #1e3d30", padding: "10px 15px", borderRadius: "12px", outline: "none" }}
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
          >
            <option value="الكل">جميع البطولات</option>
            {leagues.map((league) => (
              <option key={league} value={league}>{league}</option>
            ))}
          </select>
        </div>

        {/* أزرار الحالات التفاعلية الفاخرة */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "25px" }}>
          {[
            { id: "all", label: "الكل" },
            { id: "live", label: "🔴 مباشر" },
            { id: "upcoming", label: "⏰ لم تبدأ" },
            { id: "finished", label: "✅ انتهت" }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setSelectedStatus(btn.id)}
              style={{

              padding: "10px 20px",borderRadius: "12px",border: "1px solid #1e3d30",background: selectedStatus === btn.id ? "#2ecc71" : "rgba(255,255,255,0.02)",color: selectedStatus === btn.id ? "#06100b" : "#fff",fontWeight: "700",cursor: "pointer",transition: "0.2s"}}>{btn.label}))}{/* قائمة الكروت للمباريات */}<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>{matches.length === 0 && <p style={{ color: "#aaa" }}>لم يتم جلب أي مباريات حالياً...}{matches.length > 0 && filteredMatches.length === 0 && <p style={{ color: "#ff4d4d" }}>لا توجد مباريات تطابق الفلاتر حالياً.}{sortedMatches.map((match) => {const statusType = getStatusType(match.status);return (<div key={match.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "20px", borderRadius: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div style={{ color: "#2ecc71", fontSize: "13px", fontWeight: "bold", marginBottom: "12px" }}>🏆 {match.arabicLeague}<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}><div style={{ textAlign: "center", width: "80px" }}><img src={match.homeLogo} alt={match.home} style={{ width: "35px", height: "35px", objectFit: "contain" }} /><div style={{ fontSize: "13px", marginTop: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{match.home}<div style={{ textAlign: "center" }}><div style={{ fontSize: "20px", fontWeight: "bold" }}>{statusType === "upcoming" ? match.time : ${match.homeScore ?? 0} - ${match.awayScore ?? 0}}<span style={{ fontSize: "11px", color: statusType === "live" ? "#ff4d4d" : "#aaa" }}>{statusType === "live" ? "🔴 مباشر" : statusType === "finished" ? "انتهت" : "لم تبدأ"}<div style={{ textAlign: "center", width: "80px" }}><img src={match.awayLogo} alt={match.away} style={{ width: "35px", height: "35px", objectFit: "contain" }} /><div style={{ fontSize: "13px", marginTop: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{match.away}<a href={/matches/${match.id}} style={{ background: "#142820", color: "#2ecc71", textDecoration: "none", textAlign: "center", padding: "8px", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", border: "1px solid rgba(46,204,113,0.1)" }}>تفاصيل ورابط البث ←);})}{/* 📰 قسم طوفان الأخبار العالمي الفخم */}{loadingNews ? () : (<>{visibleCount < news.length && ()}</>)}{/* فوتر احترافي متمم */}<footer style={{ marginTop: "60px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingWith: "30px 0", color: "#666" }}>⚽ MatchZone — منصة رياضية عصرية للمباريات والنتائج والأخبار الحية.© 2026 MatchZone. All Rights Reserved.);}
