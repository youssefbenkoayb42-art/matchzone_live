import Link from "next/link";
import { getTeamCatalog, getMatchSnapshotMeta } from "../../lib/match-snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "دليل الفرق | MatchZone",
  description: "دليل فرق كرة القدم في MatchZone مع المباريات والنتائج والإحصائيات.",
};

export default async function TeamsPage() {
  const [teams, meta] = await Promise.all([
    getTeamCatalog(),
    getMatchSnapshotMeta(),
  ]);

  const visible = teams.filter((team) => team.matchCount > 0);

  return (
    <main className="mz-teams-page" dir="rtl">
      <div className="mz-teams-shell">
        <Link href="/leagues" className="mz-catalog-back">← دليل الدوريات</Link>

        <header className="mz-teams-hero">
          <span className="mz-catalog-kicker">MATCHZONE • TEAMS</span>
          <h1>دليل الفرق</h1>
          <p>كل فريق له هوية مستقلة مبنية على معرف المزود، مع صفحة خاصة للمباريات والنتائج والإحصائيات.</p>

          <div className="mz-teams-stats">
            <div>
              <strong>{visible.length}</strong>
              <span>فريق</span>
            </div>
            <div>
              <strong>{meta.counts?.total || 0}</strong>
              <span>مباراة</span>
            </div>
            <div>
              <strong>{meta.currentLeagueCount || 0}</strong>
              <span>بطولة نشطة</span>
            </div>
          </div>
        </header>

        <section className="mz-team-grid" aria-label="قائمة الفرق">
          {visible.map((team) => (
            <Link
              key={team.id}
              href={"/teams/" + encodeURIComponent(team.id)}
              className="mz-team-card"
            >
              <div className="mz-team-card-logo">
                {team.logo ? (
                  <img src={team.logo} alt="" loading="lazy" />
                ) : (
                  <span>FC</span>
                )}
              </div>

              <div>
                <h2>{team.name}</h2>
                <span>{team.provider || "MatchZone"}</span>
                <div>{team.matchCount} مباراة · {team.stats.points} نقطة</div>
              </div>
            </Link>
          ))}
        </section>

        {visible.length === 0 ? (
          <section className="mz-team-section">
            <h2>لا توجد فرق في اللقطة الحالية</h2>
            <p>ستظهر الفرق تلقائيًا بعد وصول بيانات المباريات التالية.</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
