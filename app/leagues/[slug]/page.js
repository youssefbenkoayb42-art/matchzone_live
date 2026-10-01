import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchSnapshot, getTeamCatalog } from "../../../lib/match-snapshot";

export const dynamic = "force-dynamic";

const BASE = "https://matchzone-live.vercel.app";

const LEAGUES = {
  "premier-league": { code: "eng.1", name: "الدوري الإنجليزي الممتاز", english: "Premier League", logo: "/leagues/premier-league.svg" },
  "la-liga": { code: "esp.1", name: "الدوري الإسباني", english: "La Liga", logo: "/leagues/la-liga.svg" },
  "serie-a": { code: "ita.1", name: "الدوري الإيطالي", english: "Serie A", logo: "/leagues/serie-a.svg" },
  "bundesliga": { code: "ger.1", name: "الدوري الألماني", english: "Bundesliga", logo: "/leagues/bundesliga.svg" },
  "ligue-1": { code: "fra.1", name: "الدوري الفرنسي", english: "Ligue 1", logo: "/leagues/ligue-1.svg" },
};

const FINISHED = ["FT", "AET", "PEN", "FINISHED"];
const LIVE = ["LIVE", "1H", "2H", "HT", "ET", "P"];

function status(match) {
  return String(match?.fixture?.status?.short || "NS").toUpperCase();
}

function isFinished(match) {
  return FINISHED.includes(status(match));
}

function isLive(match) {
  return LIVE.includes(status(match));
}

function formatDate(value) {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return "الموعد غير متاح";
  return date.toLocaleString("ar-MA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeSlug(slug) {
  const value = decodeURIComponent(String(slug || ""));
  if (LEAGUES[value]) return LEAGUES[value];

  const code = value.startsWith("espn:") ? value.slice(5) : value;
  return {
    code,
    name: code,
    english: code,
    logo: null,
    catalog: true,
  };
}

function MatchCard({ match, league }) {
  const home = match?.teams?.home;
  const away = match?.teams?.away;
  const finished = isFinished(match);
  const live = isLive(match);

  return (
    <article className="mz-league-match-card">
      <div className="mz-league-match-head">
        <span>{league.name}</span>
        <b className={live ? "is-live" : finished ? "is-finished" : ""}>
          {live ? "مباشر" : finished ? "انتهت" : "قادمة"}
        </b>
      </div>
      <div className="mz-league-match-date">{formatDate(match?.fixture?.date)}</div>
      <div className="mz-league-match-teams">
        <div>
          {home?.logo ? <img src={home.logo} alt="" loading="lazy" /> : <span>FC</span>}
          <strong>{home?.name || "الفريق المضيف"}</strong>
        </div>
        <div className="mz-league-score">
          {finished || live
            ? (match?.goals?.home ?? 0) + " - " + (match?.goals?.away ?? 0)
            : "— : —"}
        </div>
        <div>
          {away?.logo ? <img src={away.logo} alt="" loading="lazy" /> : <span>FC</span>}
          <strong>{away?.name || "الفريق الضيف"}</strong>
        </div>
      </div>
      <Link href={"/matches/" + encodeURIComponent(String(match?.fixture?.id || ""))}>
        تفاصيل المباراة ←
      </Link>
    </article>
  );
}

export async function generateMetadata({ params }) {
  const league = normalizeSlug(params.slug);
  return {
    title: league.name + " | المباريات والنتائج والترتيب | MatchZone",
    description: "مباريات " + league.name + " ونتائجها وترتيبها والفرق المرتبطة بها على MatchZone.",
    alternates: { canonical: BASE + "/leagues/" + encodeURIComponent(params.slug) },
    openGraph: {
      title: league.name + " | MatchZone",
      description: "المباريات والنتائج والترتيب والفرق.",
      type: "website",
    },
  };
}

export default async function LeaguePage({ params }) {
  const league = normalizeSlug(params.slug);
  const [matches, teams] = await Promise.all([getMatchSnapshot(), getTeamCatalog()]);
  const leagueId = "espn:" + league.code;

  const leagueMatches = matches.filter((match) =>
    String(match?.league?.id || "") === leagueId ||
    (LEAGUES[params.slug]?.code === "eng.1" && String(match?.league?.id || "") === "espn:eng.1")
  );

  if (!LEAGUES[params.slug] && !leagueMatches.length) notFound();

  const now = Date.now();
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = leagueMatches.filter((match) =>
    String(match?.fixture?.date || "").slice(0, 10) === todayKey
  );
  const upcoming = leagueMatches
    .filter((match) => !isFinished(match) && new Date(match?.fixture?.date || 0).getTime() >= now)
    .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date))
    .slice(0, 12);
  const results = leagueMatches
    .filter(isFinished)
    .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date))
    .slice(0, 12);

  const leagueTeams = teams
    .filter((team) => team.leagueIds?.includes(leagueId))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .slice(0, 40);


  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: league.name,
    url: BASE + "/leagues/" + params.slug,
    sport: "Soccer",
  };

  return (
    <main className="mz-league-data-page" dir="rtl">
      <div className="mz-league-data-shell">
        <Link href="/leagues" className="mz-catalog-back">← كل البطولات</Link>

        <header className="mz-league-data-hero">
          <div className="mz-league-data-logo">
            {league.logo ? <img src={league.logo} alt="" /> : <span>LG</span>}
          </div>
          <div>
            <span className="mz-catalog-kicker">MATCHZONE • LEAGUE</span>
            <h1>{league.name}</h1>
            <p>{league.english} · بيانات المباريات المخزنة في MatchZone</p>
          </div>
        </header>

        <div className="mz-league-data-stats">
          <div><strong>{today.length}</strong><span>اليوم</span></div>
          <div><strong>{upcoming.length}</strong><span>قادمة</span></div>
          <div><strong>{results.length}</strong><span>نتائج</span></div>
          <div><strong>{leagueTeams.length}</strong><span>فرق</span></div>
        </div>

        <nav className="mz-league-command">
          <Link href={"/standings/" + encodeURIComponent(params.slug)}><b>TAB</b><strong>الترتيب</strong><small>النقاط والمراكز</small></Link>
          <a href="#teams"><b>FC</b><strong>الفرق</strong><small>{leagueTeams.length} فريقًا</small></a>
          <a href="#upcoming"><b>NEXT</b><strong>القادمة</strong><small>المواجهات المقبلة</small></a>
          <a href="#results"><b>FT</b><strong>النتائج</strong><small>آخر المباريات</small></a>
        </nav>

        <section className="mz-league-data-section">
          <div className="mz-section-heading">
            <div><span className="mz-catalog-kicker">TODAY</span><h2>مباريات {league.name} اليوم</h2></div>
            <span>{today.length}</span>
          </div>
          {today.length ? (
            <div className="mz-league-match-grid">{today.map((match) => <MatchCard key={match.fixture.id} match={match} league={league} />)}</div>
          ) : (
            <p className="mz-empty-state">لا توجد مباريات لهذه البطولة اليوم في اللقطة الحالية.</p>
          )}
        </section>

        <section id="upcoming" className="mz-league-data-section">
          <div className="mz-section-heading">
            <div><span className="mz-catalog-kicker">UPCOMING</span><h2>المباريات القادمة</h2></div>
            <span>{upcoming.length}</span>
          </div>
          {upcoming.length ? (
            <div className="mz-league-match-grid">{upcoming.map((match) => <MatchCard key={match.fixture.id} match={match} league={league} />)}</div>
          ) : (
            <p className="mz-empty-state">لا توجد مباريات قادمة في اللقطة الحالية.</p>
          )}
        </section>

        <section id="teams" className="mz-league-data-section">
          <div className="mz-section-heading">
            <div><span className="mz-catalog-kicker">TEAMS</span><h2>فرق {league.name}</h2></div>
            <Link href="/teams">دليل الفرق ←</Link>
          </div>
          {leagueTeams.length ? (
            <div className="mz-league-team-grid">
              {leagueTeams.map((team) => (
                <Link key={team.id} href={"/teams/" + encodeURIComponent(team.id)} className="mz-league-team">
                  {team.logo ? <img src={team.logo} alt="" loading="lazy" /> : <span>FC</span>}
                  <strong>{team.name}</strong>
                  <small>{team.matchCount} مباراة</small>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mz-empty-state">لا توجد فرق مرتبطة بهذه البطولة في اللقطة الحالية.</p>
          )}
        </section>

        <section id="results" className="mz-league-data-section">
          <div className="mz-section-heading">
            <div><span className="mz-catalog-kicker">RESULTS</span><h2>آخر النتائج</h2></div>
            <Link href="/results">كل النتائج ←</Link>
          </div>
          {results.length ? (
            <div className="mz-league-match-grid">{results.map((match) => <MatchCard key={match.fixture.id} match={match} league={league} />)}</div>
          ) : (
            <p className="mz-empty-state">لا توجد نتائج في اللقطة الحالية.</p>
          )}
        </section>

        <nav className="mz-league-bottom-nav">
          <Link href={"/standings/" + encodeURIComponent(params.slug)}>الترتيب</Link>
          <Link href="/results">النتائج</Link>
          <Link href="/teams">الفرق</Link>
          <Link href="/leagues">البطولات</Link>
        </nav>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
