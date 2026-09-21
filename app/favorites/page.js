"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const [alerts, setAlerts] = useState([]);
  const [snapshotReady, setSnapshotReady] = useState(false);
  const favoritesRef = useRef([]);
  const snapshotReadyRef = useRef(false);

  function loadFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem("matchzone-favorite-teams") || "[]");
      const next = Array.isArray(saved) ? saved : [];
      favoritesRef.current = next;
      setFavorites(next);
    } catch {
      favoritesRef.current = [];
      setFavorites([]);
    }
  }

  async function refreshMatches(silent = false) {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch("/api/football", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const nextMatches = (data.response || []).map(normalizeMatch).filter((match) => match.id);

      try {
        const raw = localStorage.getItem("matchzone-favorite-match-snapshots");
        const previous = raw ? JSON.parse(raw) : {};
        const nextSnapshot = {};
        const newAlerts = [];

        nextMatches.forEach((match) => {
          if (!favoritesRef.current.includes(match.home) && !favoritesRef.current.includes(match.away)) return;
          const key = String(match.id);
          const current = {
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            status: match.status,
          };
          nextSnapshot[key] = current;
          const old = previous[key];
          if (old && (current.homeScore !== old.homeScore || current.awayScore !== old.awayScore)) {
            newAlerts.push({
              id: `${key}-goal-${Date.now()}`,
              text: `⚽ هدف جديد: ${match.home} ${current.homeScore ?? 0} - ${current.awayScore ?? 0} ${match.away}`,
            });
          } else if (old && getStatusType(old.status) !== "live" && getStatusType(current.status) === "live") {
            newAlerts.push({
              id: `${key}-live-${Date.now()}`,
              text: `🔴 بدأت المباراة: ${match.home} ضد ${match.away}`,
            });
          }
        });

        localStorage.setItem("matchzone-favorite-match-snapshots", JSON.stringify(nextSnapshot));
        if (snapshotReadyRef.current && newAlerts.length) {
          setAlerts(newAlerts.slice(0, 3));
          window.setTimeout(() => setAlerts([]), 7000);
        }
        if (!snapshotReadyRef.current) {
          snapshotReadyRef.current = true;
          setSnapshotReady(true);
        }
      } catch {}

      setMatches(nextMatches);
      setLastUpdated(new Date());
    } catch {
      // Keep the last successful data visible if a refresh temporarily fails.
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

  const favoriteMatchGroups = useMemo(() => ({
    live: favoriteMatches.filter((match) => getStatusType(match.status) === "live"),
    upcoming: favoriteMatches.filter((match) => getStatusType(match.status) === "upcoming"),
    finished: favoriteMatches.filter((match) => getStatusType(match.status) === "finished"),
  }), [favoriteMatches]);

  function removeFavorite(team) {
    const next = favorites.filter((name) => name !== team);
    setFavorites(next);
    try {
      localStorage.setItem("matchzone-favorite-teams", JSON.stringify(next));
      window.dispatchEvent(new Event("matchzone-favorites-updated"));
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

        {alerts.length > 0 && (
          <div className="favorites-alerts" role="status" aria-live="polite">
            {alerts.map((alert) => <div className="favorites-alert" key={alert.id}>{alert.text}</div>)}
          </div>
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
              <div className="favorites-groups">
                {[
                  { key: "live", title: "🔴 مباريات مباشرة الآن", matches: favoriteMatchGroups.live },
                  { key: "upcoming", title: "🟢 المباريات القادمة", matches: favoriteMatchGroups.upcoming },
                  { key: "finished", title: "⚪ المباريات المنتهية", matches: favoriteMatchGroups.finished },
                ].filter((group) => group.matches.length > 0).map((group) => (
                  <section className={`favorites-group favorites-group-${group.key}`} key={group.key}>
                    <div className="favorites-group-heading">
                      <strong>{group.title}</strong>
                      <span>{group.matches.length} مباراة</span>
                    </div>
                    <div className="favorites-match-grid">
                      {group.matches.map((match) => (
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
                  </section>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
