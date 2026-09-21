"use client";

import { useEffect, useMemo, useState } from "react";

function getStatusType(status) {
  const value = String(status || "").toUpperCase();
  if (["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(value)) return "live";
  if (["FT", "AET", "PEN", "FINISHED"].includes(value)) return "finished";
  return "upcoming";
}

function statusLabel(status) {
  const type = getStatusType(status);
  if (type === "live") return "🔴 مباشر";
  if (type === "finished") return "انتهت";
  return "قادمة";
}

function formatTime(date) {
  if (!date) return "--:--";
  return new Date(date).toLocaleTimeString("ar-MA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeMatch(item) {
  return {
    id: item?.fixture?.id,
    date: item?.fixture?.date,
    home: item?.teams?.home?.name || "الفريق المضيف",
    away: item?.teams?.away?.name || "الفريق الضيف",
    homeLogo: item?.teams?.home?.logo || null,
    awayLogo: item?.teams?.away?.logo || null,
    homeScore: item?.goals?.home,
    awayScore: item?.goals?.away,
    status: item?.fixture?.status?.short || "NS",
    league: item?.arabicLeague || item?.league?.name || "بطولة كرة القدم",
  };
}

function TeamBadge({ src, name }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="favorites-team-badge">⚽</span>;
  return (
    <img
      src={src}
      alt={name}
      className="favorites-team-badge"
      onError={() => setFailed(true)}
    />
  );
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  function loadFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem("matchzone-favorite-teams") || "[]");
      setFavorites(Array.isArray(saved) ? saved : []);
    } catch {
      setFavorites([]);
    }
  }

  async function refreshMatches(silent = false) {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch("/api/football", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setMatches((data.response || []).map(normalizeMatch).filter((match) => match.id));
      setLastUpdated(new Date());
    } catch {
      if (!matches.length) setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadFavorites();
    refreshMatches();
    const timer = setInterval(() => refreshMatches(true), 30000);
    const onStorage = () => loadFavorites();
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const favoriteMatches = useMemo(
    () => matches
      .filter((match) => favorites.includes(match.home) || favorites.includes(match.away))
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0)),
    [matches, favorites]
  );

  function removeFavorite(team) {
    const next = favorites.filter((name) => name !== team);
    setFavorites(next);
    try {
      localStorage.setItem("matchzone-favorite-teams", JSON.stringify(next));
    } catch {}
  }

  return (
    <main className="favorites-page" dir="rtl">
      <div className="favorites-container">
        <header className="favorites-hero">
          <span className="section-kicker">MY TEAMS</span>
          <h1>فرقك المفضلة ⭐</h1>
          <p>مكان واحد لمتابعة الفرق التي تهمك ومبارياتها الحالية والقادمة.</p>
        </header>

        {favorites.length > 0 ? (
          <section className="favorites-teams-panel">
            <div className="favorites-panel-heading">
              <div>
                <strong>الفرق التي تتابعها</strong>
                <span>{favorites.length} فريق</span>
              </div>
              <a href="/">← العودة للرئيسية</a>
            </div>
            <div className="favorites-team-list">
              {favorites.map((team) => {
                const match = matches.find((item) => item.home === team || item.away === team);
                const logo = match?.home === team ? match.homeLogo : match?.awayLogo;
                return (
                  <div className="favorites-team-item" key={team}>
                    <a href={`/teams/${encodeURIComponent(team)}`}>
                      <TeamBadge src={logo} name={team} />
                      <strong>{team}</strong>
                    </a>
                    <button onClick={() => removeFavorite(team)} aria-label={`إزالة ${team} من المفضلة`}>×</button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="favorites-empty">
            <span>⭐</span>
            <h2>لم تضف أي فريق بعد</h2>
            <p>افتح صفحة أي فريق واضغط «أضف إلى المفضلة» ليظهر هنا.</p>
            <a href="/matches/today">اكتشف مباريات اليوم ←</a>
          </section>
        )}

        {favorites.length > 0 && (
          <section className="favorites-matches">
            <div className="favorites-panel-heading">
              <div>
                <strong>مباريات فرقك</strong>
                <span>{favoriteMatches.length} مباراة ضمن البيانات المتاحة{lastUpdated ? ` • آخر تحديث ${lastUpdated.toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
              </div>
              <button className="favorites-refresh-button" onClick={() => refreshMatches()} disabled={refreshing}>
                {refreshing ? "جاري التحديث..." : "↻ تحديث"}
              </button>
            </div>

            {loading ? (
              <div className="favorites-empty compact"><span>⏳</span><p>جارٍ تحميل المباريات...</p></div>
            ) : favoriteMatches.length === 0 ? (
              <div className="favorites-empty compact"><span>⚽</span><p>لا توجد مباراة لفرقك ضمن المباريات المتاحة حاليًا.</p></div>
            ) : (
              <div className="favorites-match-grid">
                {favoriteMatches.map((match) => (
                  <article className={getStatusType(match.status) === "live" ? "favorites-match-card live" : "favorites-match-card"} key={match.id}>
                    <div className="favorites-match-meta">
                      <span>{match.league}</span>
                      <b>{statusLabel(match.status)}</b>
                    </div>
                    <div className="favorites-match-teams">
                      <a href={`/teams/${encodeURIComponent(match.home)}`}>
                        <TeamBadge src={match.homeLogo} name={match.home} />
                        <strong>{match.home}</strong>
                      </a>
                      <div>
                        <strong>{match.homeScore ?? "-"} - {match.awayScore ?? "-"}</strong>
                        <span>{formatTime(match.date)}</span>
                      </div>
                      <a href={`/teams/${encodeURIComponent(match.away)}`}>
                        <TeamBadge src={match.awayLogo} name={match.away} />
                        <strong>{match.away}</strong>
                      </a>
                    </div>
                    <a className="favorites-match-details" href={`/matches/${match.id}`}>تفاصيل المباراة ←</a>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
