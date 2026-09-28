import Link from "next/link";
import { getMatchSnapshot, getMatchSnapshotMeta, getTeamCatalog } from "../../../../lib/match-snapshot";

export const dynamic = "force-dynamic";

function statusLabel(status) {
  const value = String(status || "").toUpperCase();
  if (["LIVE","1H","2H","HT","ET","P"].includes(value)) return "مباشر";
  if (["FT","AET","PEN","FINISHED"].includes(value)) return "انتهت";
  return "قادمة";
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("ar-MA", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
  } catch { return ""; }
}

function Logo({ team }) {
  const src = team?.logo;
  if (!src) return <span className="mz-catalog-team-logo">FC</span>;
  return <img className="mz-catalog-team-img" src={src} alt="" loading="lazy" />;
}

export async function generateMetadata({ params }) {
  const id = decodeURIComponent(params.id || "");
  const meta = await getMatchSnapshotMeta();
  const league = meta.leagues.find((item) => String(item.id) === id);
  const name = league?.name || "بطولة كرة القدم";
  return {
    title: name + " | مباريات ونتائج | MatchZone",
    description: "مباريات ونتائج " + name + " من بيانات MatchZone المجانية.",
    alternates: { canonical: "https://matchzone-live.vercel.app/leagues/catalog/" + encodeURIComponent(id) },
  };
}

export default async function CatalogLeaguePage({ params }) {
  const id = decodeURIComponent(params.id || "");
  const [matches, meta, teams] = await Promise.all([getMatchSnapshot(), getMatchSnapshotMeta(), getTeamCatalog()]);
  const league = meta.leagues.find((item) => String(item.id) === id);
  const leagueMatches = matches.filter((match) => String(match?.league?.id || "") === id);
  const leagueTeamIds = new Set(
    leagueMatches.flatMap((match) => [
      match?.teams?.home?.identity || match?.teams?.home?.id,
      match?.teams?.away?.identity || match?.teams?.away?.id,
    ]).filter(Boolean).map(String)
  );
  const leagueTeams = teams.filter((team) => leagueTeamIds.has(String(team.id)));

  if (!league) {
    return <main className="mz-league-detail" dir="rtl"><div className="mz-league-detail-shell"><h1>البطولة غير موجودة</h1><Link href="/leagues">← العودة إلى دليل الدوريات</Link></div></main>;
  }

  const sorted = [...leagueMatches].sort((a,b) => new Date(b?.fixture?.date || 0) - new Date(a?.fixture?.date || 0));
  const finished = sorted.filter((m) => ["FT","AET","PEN","FINISHED"].includes(String(m?.fixture?.status?.short || "").toUpperCase()));
  const upcoming = sorted.filter((m) => !finished.includes(m)).reverse();

  return (
    <main className="mz-league-detail" dir="rtl">
      <div className="mz-league-detail-shell">
        <Link href="/leagues" className="mz-league-detail-back">← دليل الدوريات</Link>
        <header className="mz-league-detail-hero">
          <span className="mz-league-detail-badge">LG</span>
          <div><span className="mz-catalog-kicker">MATCHZONE • LEAGUE</span><h1>{league.name}</h1><p>{league.region || "دولي"} · {league.season || "الموسم الحالي"} · المصدر: {league.source}</p></div>
        </header>

        <div className="mz-league-detail-stats">
          <div><strong>{leagueMatches.length}</strong><span>مباراة في اللقطة</span></div>
          <div><strong>{finished.length}</strong><span>نتيجة نهائية</span></div>
          <div><strong>{upcoming.length}</strong><span>مباراة قادمة</span></div>
        </div>

        <section className="mz-league-detail-section">
          <h2>المباريات والنتائج</h2>
          {sorted.length ? <div className="mz-catalog-match-list">{sorted.slice(0,120).map((match) => {
            const home = match?.teams?.home || {};
            const away = match?.teams?.away || {};
            return <Link href={"/matches/" + encodeURIComponent(String(match?.fixture?.id || ""))} className="mz-catalog-match" key={String(match?.fixture?.id || "")}>
              <div className="mz-catalog-match-meta"><span>{statusLabel(match?.fixture?.status?.short)}</span><small>{formatDate(match?.fixture?.date)}</small></div>
              <div className="mz-catalog-team"><span>{home.name || "المضيف"}</span><Logo team={home}/></div>
              <div className="mz-catalog-score"><strong>{match?.goals?.home ?? "–"}</strong><i>:</i><strong>{match?.goals?.away ?? "–"}</strong></div>
              <div className="mz-catalog-team mz-catalog-team-away"><Logo team={away}/><span>{away.name || "الضيف"}</span></div>
            </Link>;
          })}</div> : <div className="mz-catalog-empty">لا توجد مباريات مرتبطة بهذه البطولة في لقطة البيانات الحالية.</div>}
        </section>
      </div>
    </main>
  );
}
