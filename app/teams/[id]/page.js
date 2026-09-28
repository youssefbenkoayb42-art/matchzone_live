import Link from "next/link";
import {
  getTeamById,
  getTeamMatches,
  getMatchSnapshotMeta,
} from "../../../lib/match-snapshot";

export const dynamic = "force-dynamic";

const FINISHED = ["FT", "AET", "PEN", "FINISHED"];

function isFinished(match) {
  return FINISHED.includes(
    String(match?.fixture?.status?.short || "").toUpperCase()
  );
}

function formatDate(value) {
  if (!value) return "الموعد غير متاح";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "الموعد غير متاح";

  return date.toLocaleString("ar-MA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TeamLogo({ team }) {
  return (
    <div className="mz-team-card-logo">
      {team?.logo ? (
        <img src={team.logo} alt="" width="64" height="64" />
      ) : (
        <span>FC</span>
      )}
    </div>
  );
}

function MatchRow({ match }) {
  const status = String(match?.fixture?.status?.short || "NS").toUpperCase();
  const finished = FINISHED.includes(status);
  const home = match?.teams?.home;
  const away = match?.teams?.away;

  return (
    <Link
      href={"/matches/" + encodeURIComponent(String(match?.fixture?.id || ""))}
      className="mz-team-match"
    >
      <div className="mz-team-match-date">{formatDate(match?.fixture?.date)}</div>

      <div className="mz-team-match-teams">
        <span>{home?.name || "الفريق المضيف"}</span>
        <strong>
          {finished
            ? (match?.goals?.home ?? "—") + " : " + (match?.goals?.away ?? "—")
            : "— : —"}
        </strong>
        <span>{away?.name || "الفريق الضيف"}</span>
      </div>

      <span className="mz-team-match-status">
        {finished ? "انتهت" : status === "LIVE" ? "مباشر" : "قادمة"}
      </span>
    </Link>
  );
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const team = await getTeamById(id);

  if (!team) {
    return {
      title: "الفريق غير موجود | MatchZone",
      description: "تعذر العثور على الفريق المطلوب في بيانات MatchZone الحالية.",
    };
  }

  const title = team.name + " | المباريات والنتائج والإحصائيات | MatchZone";
  const description =
    "صفحة " +
    team.name +
    " في MatchZone: آخر النتائج، المباريات القادمة، السجل والإحصائيات المتاحة.";

  return {
    title,
    description,
    alternates: {
      canonical: "https://matchzone-live.vercel.app/teams/" + encodeURIComponent(id),
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: "https://matchzone-live.vercel.app/teams/" + encodeURIComponent(id),
      images: team.logo ? [team.logo] : undefined,
    },
  };
}

export default async function TeamDetailPage({ params }) {
  const { id } = await params;

  const [team, matches, meta] = await Promise.all([
    getTeamById(id),
    getTeamMatches(id),
    getMatchSnapshotMeta(),
  ]);

  if (!team) {
    return (
      <main className="mz-team-detail-page" dir="rtl">
        <div className="mz-teams-shell">
          <section className="mz-team-section">
            <span className="mz-catalog-kicker">404 • TEAM</span>
            <h1>الفريق غير موجود</h1>
            <p>قد تكون هوية الفريق قد تغيرت أو لم تعد موجودة في لقطة البيانات الحالية.</p>
            <Link href="/teams" className="mz-catalog-back">← العودة إلى دليل الفرق</Link>
          </section>
        </div>
      </main>
    );
  }

  const ordered = [...matches].sort(
    (a, b) =>
      new Date(b?.fixture?.date || 0).getTime() -
      new Date(a?.fixture?.date || 0).getTime()
  );

  const results = ordered.filter(isFinished).slice(0, 10);
  const upcoming = [...ordered]
    .filter((match) => !isFinished(match))
    .sort(
      (a, b) =>
        new Date(a?.fixture?.date || 0).getTime() -
        new Date(b?.fixture?.date || 0).getTime()
    )
    .slice(0, 10);

  const leagues = (team.leagueIds || [])
    .map((leagueId) =>
      (meta.leagues || []).find((league) => String(league.id) === String(leagueId))
    )
    .filter(Boolean);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    url:
      "https://matchzone-live.vercel.app/teams/" +
      encodeURIComponent(String(id)),
    sport: "Football",
    logo: team.logo || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="mz-team-detail-page" dir="rtl">
        <div className="mz-teams-shell">
          <Link href="/teams" className="mz-catalog-back">
            ← دليل الفرق
          </Link>

          <section className="mz-team-detail-hero">
            <TeamLogo team={team} />
            <div>
              <span className="mz-catalog-kicker">MATCHZONE • TEAM</span>
              <h1>{team.name}</h1>
              <p>
                {team.provider || "مزود البيانات"} · {team.providerId || team.id}
              </p>
              {leagues.length > 0 ? (
                <div className="mz-team-leagues">
                  {leagues.slice(0, 6).map((league) => (
                    <Link
                      key={league.id}
                      href={"/leagues/catalog/" + encodeURIComponent(String(league.id))}
                    >
                      {league.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <section className="mz-team-stat-grid" aria-label="إحصائيات الفريق">
            <div><strong>{team.stats.played}</strong><span>لعب</span></div>
            <div><strong>{team.stats.wins}</strong><span>فوز</span></div>
            <div><strong>{team.stats.draws}</strong><span>تعادل</span></div>
            <div><strong>{team.stats.losses}</strong><span>هزيمة</span></div>
            <div><strong>{team.stats.points}</strong><span>نقاط</span></div>
            <div><strong>{team.stats.goalDifference}</strong><span>فرق الأهداف</span></div>
          </section>

          <section className="mz-team-section">
            <div className="mz-section-heading">
              <div>
                <span className="mz-catalog-kicker">UPCOMING</span>
                <h2>المباريات القادمة</h2>
              </div>
              <span>{team.upcomingCount} مباراة</span>
            </div>

            {upcoming.length > 0 ? (
              <div className="mz-team-match-list">
                {upcoming.map((match) => (
                  <MatchRow
                    key={String(match?.fixture?.id || "")}
                    match={match}
                  />
                ))}
              </div>
            ) : (
              <p className="mz-empty-state">لا توجد مباراة قادمة في اللقطة الحالية.</p>
            )}
          </section>

          <section className="mz-team-section">
            <div className="mz-section-heading">
              <div>
                <span className="mz-catalog-kicker">RESULTS</span>
                <h2>آخر النتائج</h2>
              </div>
              <span>{team.finishedCount} مباراة مكتملة</span>
            </div>

            {results.length > 0 ? (
              <div className="mz-team-match-list">
                {results.map((match) => (
                  <MatchRow
                    key={String(match?.fixture?.id || "")}
                    match={match}
                  />
                ))}
              </div>
            ) : (
              <p className="mz-empty-state">لا توجد نتائج مكتملة في اللقطة الحالية.</p>
            )}
          </section>

          <section className="mz-team-section">
            <div className="mz-section-heading">
              <div>
                <span className="mz-catalog-kicker">TEAM STATS</span>
                <h2>إحصائيات الفريق</h2>
              </div>
            </div>

            <div className="mz-team-stat-details">
              <div><span>الأهداف المسجلة</span><strong>{team.stats.goalsFor}</strong></div>
              <div><span>الأهداف المستقبلة</span><strong>{team.stats.goalsAgainst}</strong></div>
              <div><span>فرق الأهداف</span><strong>{team.stats.goalDifference}</strong></div>
              <div><span>الشباك النظيفة</span><strong>{team.stats.cleanSheets}</strong></div>
            </div>

            <p className="mz-team-note">
              الإحصائيات محسوبة من مباريات الفريق الموجودة حاليًا في لقطة MatchZone.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
