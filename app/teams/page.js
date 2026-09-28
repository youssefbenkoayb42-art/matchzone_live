import Link from "next/link";
import { getTeamCatalog, getMatchSnapshotMeta } from "../../lib/match-snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "الفرق | MatchZone", description: "دليل فرق كرة القدم في MatchZone مع المباريات والنتائج والإحصائيات." };

export default async function TeamsPage({ searchParams }) {
  const [teams, meta] = await Promise.all([getTeamCatalog(), getMatchSnapshotMeta()]);
  const visible = teams.filter((team) => team.matchCount > 0);
  return (
    <main className="mz-teams-page" dir="rtl"><div className="mz-teams-shell">
      <Link href="/leagues" className="mz-catalog-back">← دليل الدوريات</Link>
      <header className="mz-teams-hero">
        <span className="mz-catalog-kicker">MATCHZONE • TEAMS</span><h1>دليل الفرق</h1>
        <p>الهوية تعتمد على معرف المزود، وليس اسم الفريق، حتى لا تختلط الشعارات أو بيانات الفرق المتشابهة.</p>
        <div className="mz-teams-stats">
          <div><strong>{visible.length}</strong><span>فريق في اللقطة</span></div>
          <div><strong>{meta.counts?.total || 0}</strong><span>مباراة متاحة</span></div>
          <div><strong>{meta.currentLeagueCount || 0}</strong><span>بطولة بتغطية حالية</span></div>
        </div>
      </header>
      {visible.length ? <section className="mz-team-grid">{visible.map((team) =>
        <Link key={team.id} href={"/teams/"+encodeURIComponent(team.id)} className="mz-team-card">
          <div className="mz-team-card-logo">{team.logo ? <img src={team.logo} alt="" loading="lazy"/> : <span>FC</span>}</div>
          <div className="mz-team-card-body"><h2>{team.name}</h2><span className="mz-team-provider">{team.provider || "مصدر MatchZone"}</span>
            <div className="mz-team-card-meta"><span>{team.matchCount} مباراة</span><span>{team.stats.points} نقطة محسوبة</span></div>
          </div>
        </Link>
      )}</section> : <div className="mz-catalog-empty">لا توجد فرق في لقطة البيانات الحالية.</div>}
    </div></main>
  );
}
