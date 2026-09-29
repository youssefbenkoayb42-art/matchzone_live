import { getMatchSnapshot, getMatchSnapshotMeta } from "../../lib/match-snapshot";

const LIVE = new Set(["LIVE","1H","2H","HT","ET","BT","P","INT"]);
const FINISHED = new Set(["FT","AET","PEN","FINISHED"]);
const status = (m) => String(m?.fixture?.status?.short || "NS").toUpperCase();
const goals = (m) => {
  const h = Number(m?.goals?.home), a = Number(m?.goals?.away);
  return Number.isFinite(h) && Number.isFinite(a) ? h + a : null;
};
const name = (m, side) => m?.teams?.[side]?.name || (side === "home" ? "المضيف" : "الضيف");
const league = (m) => m?.league?.name || m?.arabicLeague || "بطولة أخرى";
const time = (v) => v ? new Date(v).toLocaleTimeString("ar-MA",{hour:"2-digit",minute:"2-digit"}) : "--:--";

export const metadata = {
  title: "إحصائيات كرة القدم | MatchZone",
  description: "مركز MatchZone لإحصائيات المباريات والنتائج والبطولات.",
  alternates: { canonical: "https://matchzone-live.vercel.app/stats" },
};

export default async function StatsPage() {
  const [matches, meta] = await Promise.all([getMatchSnapshot(), getMatchSnapshotMeta()]);
  const live = matches.filter(m => LIVE.has(status(m)));
  const finished = matches.filter(m => FINISHED.has(status(m)));
  const upcoming = matches.filter(m => !LIVE.has(status(m)) && !FINISHED.has(status(m)));
  const goalMatches = finished.filter(m => goals(m) !== null);
  const totalGoals = goalMatches.reduce((s,m) => s + goals(m), 0);
  const average = goalMatches.length ? (totalGoals / goalMatches.length).toFixed(2) : "0.00";

  const leagueMap = new Map();
  for (const m of matches) {
    const key = league(m);
    const x = leagueMap.get(key) || { name:key, matches:0, finished:0, goals:0, goalMatches:0 };
    x.matches++;
    if (FINISHED.has(status(m))) {
      x.finished++;
      const g = goals(m);
      if (g !== null) { x.goals += g; x.goalMatches++; }
    }
    leagueMap.set(key,x);
  }
  const leagues = [...leagueMap.values()]
    .map(x => ({...x, average:x.goalMatches ? (x.goals/x.goalMatches).toFixed(2) : "0.00"}))
    .sort((a,b) => b.matches-a.matches)
    .slice(0,12);

  const highScoring = [...goalMatches].sort((a,b) => goals(b)-goals(a)).slice(0,8);
  const next = [...upcoming].sort((a,b) => new Date(a?.fixture?.date||0)-new Date(b?.fixture?.date||0)).slice(0,10);

  return (
    <main className="mz-stats-page" dir="rtl">
      <div className="mz-stats-shell">
        <a href="/" className="mz-stats-back">← العودة إلى MatchZone</a>
        <header className="mz-stats-hero">
          <div><span className="section-kicker">MATCHZONE INTELLIGENCE</span><h1>مركز الإحصائيات</h1><p>أرقام حقيقية محسوبة من نفس بيانات المباريات المجانية التي تغذي المنصة.</p></div>
          <div className="mz-stats-update"><span>آخر مزامنة</span><strong>{meta.updatedAt ? new Date(meta.updatedAt).toLocaleDateString("ar-MA") : "--"}</strong><small>{meta.updatedAt ? time(meta.updatedAt) : "--:--"}</small></div>
        </header>

        <section className="mz-stats-kpis">
          <article><span>كل المباريات</span><strong>{matches.length}</strong><small>اللقطة الحالية</small></article>
          <article><span>مباشرة</span><strong className="live">{live.length}</strong><small>حاليًا</small></article>
          <article><span>منتهية</span><strong>{finished.length}</strong><small>نتائج</small></article>
          <article><span>قادمة</span><strong>{upcoming.length}</strong><small>مواعيد</small></article>
          <article><span>الأهداف</span><strong>{totalGoals}</strong><small>في النتائج</small></article>
          <article><span>متوسط الأهداف</span><strong>{average}</strong><small>للمباراة المنتهية</small></article>
        </section>

        <section className="mz-stats-grid">
          <article className="mz-stats-card mz-stats-card-wide">
            <div className="mz-stats-card-head"><div><span className="section-kicker">COMPETITIONS</span><h2>نشاط البطولات</h2></div><a href="/leagues">كل البطولات ←</a></div>
            <div className="mz-league-stats-list">
              {leagues.map(x => <div className="mz-league-stat-row" key={x.name}><div><strong>{x.name}</strong><small>{x.finished} منتهية · متوسط {x.average} هدف</small></div><b>{x.matches}</b></div>)}
            </div>
          </article>

          <article className="mz-stats-card">
            <div className="mz-stats-card-head"><div><span className="section-kicker">GOALS</span><h2>مباريات كثيرة الأهداف</h2></div><a href="/results">النتائج ←</a></div>
            <div className="mz-goal-list">
              {highScoring.map(m => <a href={`/matches/${encodeURIComponent(String(m?.fixture?.id||""))}`} key={m?.fixture?.id}><div><strong>{name(m,"home")}</strong><span>{name(m,"away")}</span></div><b>{m?.goals?.home ?? 0} - {m?.goals?.away ?? 0}</b></a>)}
            </div>
          </article>
        </section>

        <section className="mz-stats-card">
          <div className="mz-stats-card-head"><div><span className="section-kicker">UP NEXT</span><h2>المباريات القادمة</h2></div><a href="/matches/today">مركز المباريات ←</a></div>
          <div className="mz-upcoming-stats-grid">
            {next.map(m => <a className="mz-upcoming-stat-match" href={`/matches/${encodeURIComponent(String(m?.fixture?.id||""))}`} key={m?.fixture?.id}><small>{league(m)}</small><strong>{name(m,"home")}</strong><span>{time(m?.fixture?.date)}</span><strong>{name(m,"away")}</strong></a>)}
          </div>
        </section>

        <footer className="mz-stats-foot">البيانات محسوبة من snapshot MatchZone — لا توجد استدعاءات لمزود خارجي من صفحة الزائر.</footer>
      </div>
    </main>
  );
}