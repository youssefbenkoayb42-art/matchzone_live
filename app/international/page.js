"use client";

import { useEffect, useMemo, useState } from "react";

function typeLabel(type) {
  return type === "international-team" ? "منتخبات" : "أندية دولية";
}

function statusType(status) {
  const value = String(status || "").toUpperCase();
  if (["LIVE", "1H", "2H", "HT", "ET", "P"].includes(value)) return "live";
  if (["FT", "AET", "PEN", "FINISHED"].includes(value)) return "finished";
  return "upcoming";
}

function timeLabel(date) {
  if (!date) return "--:--";
  return new Date(date).toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" });
}

export default function InternationalPage() {
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const competitions = useMemo(() => {
    const map = new Map();
    matches.forEach((match) => {
      const id = match?.league?.id ?? match?.league?.idLeague;
      const name = match?.league?.name || match?.league?.english || match?.arabicLeague;
      if (id && name && !map.has(String(id))) {
        map.set(String(id), { id: String(id), name, badge: match?.league?.logo || match?.league?.badge });
      }
    });
    return Array.from(map.values()).slice(0, 16);
  }, [matches]);

  useEffect(() => {
    fetch("/api/football", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) =>
        setMatches(
          (data.response || []).filter((m) =>
            ["international-team", "international-club"].includes(m.competitionType)
          )
        )
      )
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => matches.filter((m) => filter === "all" || m.competitionType === filter),
    [matches, filter]
  );

  return (
    <main className="international-page" dir="rtl">
      <section className="international-hero">
        <span className="section-kicker">GLOBAL FOOTBALL</span>
        <h1>العالمية</h1>
        <p>مباريات المنتخبات وأهم بطولات الأندية الدولية في واجهة واحدة.</p>
        <div className="international-tabs">
          {[["all", "الكل"], ["international-team", "المنتخبات"], ["international-club", "الأندية الدولية"]].map(
            ([value, label]) => (
              <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>
                {label}
              </button>
            )
          )}
        </div>
      </section>

      <section className="international-content">
        {!loading && competitions.length > 0 && (
          <section className="international-competitions">
            <div className="section-heading">
              <div>
                <span className="section-kicker">DISCOVER</span>
                <h2>البطولات العالمية</h2>
                <p>بطولات دولية تم اكتشافها تلقائيًا من جدول المباريات المتاح.</p>
              </div>
            </div>
            <div className="international-competition-grid">
              {competitions.map((competition) => (
                <a key={competition.id} href={`/leagues/league-${competition.id}`} className="international-competition-card">
                  {competition.badge ? <img src={competition.badge} alt="" loading="lazy" /> : <span className="competition-glyph">GL</span>}
                  <strong>{competition.name}</strong>
                  <span>فتح البطولة ←</span>
                </a>
              ))}
            </div>
          </section>
        )}
        <div className="section-heading">
          <div>
            <span className="section-kicker">LIVE • NEXT • RESULTS</span>
            <h2>المباريات العالمية</h2>
            <p>يتم عرض ما يوفره مصدر المباريات المجاني تلقائيًا.</p>
          </div>
          <a href="/">← الرئيسية</a>
        </div>

        {loading && <div className="international-state">جارٍ تحميل المباريات العالمية...</div>}

        {!loading && filtered.length === 0 && (
          <div className="international-state">
            <strong>لا توجد مباريات دولية ضمن البيانات المتاحة حاليًا.</strong>
            <span>جرّب العودة لاحقًا؛ يتم تحديث البيانات تلقائيًا.</span>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="international-grid">
            {filtered.map((match) => {
              const state = statusType(match.fixture?.status?.short);
              return (
                <article
                  className={`international-card ${state === "live" ? "international-live" : ""}`}
                  key={match.eventId || match.fixture?.id}
                >
                  <div className="international-card-top">
                    <span className="international-type">{typeLabel(match.competitionType)}</span>
                    <span className={`international-status ${state}`}>
                      {state === "live" ? "LIVE" : state === "finished" ? "FT" : "NEXT"}
                    </span>
                  </div>
                  <div className="international-league">{match.league?.name || match.arabicLeague}</div>
                  <div className="international-teams">
                    <div>
                      {match.teams?.home?.logo && <img src={match.teams.home.logo} alt="" loading="lazy" />}
                      <strong>{match.teams?.home?.name || "الفريق المضيف"}</strong>
                    </div>
                    <div className="international-score">
                      <strong>{match.goals?.home ?? "-"} - {match.goals?.away ?? "-"}</strong>
                      <span>{timeLabel(match.fixture?.date)}</span>
                    </div>
                    <div>
                      {match.teams?.away?.logo && <img src={match.teams.away.logo} alt="" loading="lazy" />}
                      <strong>{match.teams?.away?.name || "الفريق الضيف"}</strong>
                    </div>
                  </div>
                  <a href={`/matches/${match.fixture?.id}`} className="match-details">
                    تفاصيل المباراة <span>←</span>
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
