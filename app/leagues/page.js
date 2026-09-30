import Link from "next/link";
import { getMatchSnapshotMeta } from "../../lib/match-snapshot";

const FEATURED = [
  ["premier-league", "الدوري الإنجليزي الممتاز", "Premier League", "/leagues/premier-league.svg"],
  ["la-liga", "الدوري الإسباني", "LaLiga", "/leagues/la-liga.svg"],
  ["serie-a", "الدوري الإيطالي", "Serie A", "/leagues/serie-a.svg"],
  ["bundesliga", "الدوري الألماني", "Bundesliga", "/leagues/bundesliga.svg"],
  ["ligue-1", "الدوري الفرنسي", "Ligue 1", "/leagues/ligue-1.svg"],
];

export const dynamic = "force-dynamic";
export const metadata = {
  title: "دليل دوريات كرة القدم | MatchZone",
  description: "دليل موحد لدوريات كرة القدم التي يجمعها MatchZone من مصادر مجانية، مع المباريات والنتائج والتغطية الحالية.",
  alternates: { canonical: "https://matchzone-live.vercel.app/leagues" },
};

function catalogSlug(id) {
  return encodeURIComponent(String(id || ""));
}

function regionLabel(region) {
  return region || "دولي";
}

const CATALOG_LEAGUE_LOGOS = {
  "openfoot:comp_botola_pro_mar": "https://logowik.com/content/uploads/images/botolapro2288.logowik.com.webp",
};

function leagueLogo(league) {
  return (
    league?.logo ||
    CATALOG_LEAGUE_LOGOS[String(league?.id || "")] ||
    null
  );
}

export default async function LeaguesPage() {
  const meta = await getMatchSnapshotMeta();
  const catalog = Array.isArray(meta.leagues) ? meta.leagues : [];
  const current = catalog.filter((league) => league.currentCoverage);
  const featuredIds = new Set(FEATURED.map(([slug]) => slug));

  return (
    <main className="mz-leagues-catalog" dir="rtl">
      <div className="mz-catalog-shell">
        <Link href="/" className="mz-catalog-back">← الرئيسية</Link>

        <header className="mz-catalog-hero">
          <div>
            <span className="mz-catalog-kicker">MATCHZONE • FOOTBALL CATALOG</span>
            <h1>دليل دوريات كرة القدم</h1>
            <p>كتالوج موحد مبني من لقطة البيانات المجانية. نعرض التغطية الفعلية منفصلة عن الدوريات المكتشفة تاريخيًا.</p>
          </div>
          <div className="mz-catalog-stats">
            <div><strong>{catalog.length}</strong><span>دوري مكتشف</span></div>
            <div><strong>{current.length}</strong><span>بتغطية حالية</span></div>
            <div><strong>{meta.counts?.total || 0}</strong><span>مباراة في اللقطة</span></div>
          </div>
        </header>

        <section className="mz-catalog-section">
          <div className="mz-catalog-section-head">
            <div>
              <span>TOP COMPETITIONS</span>
              <h2>البطولات الكبرى</h2>
            </div>
            <Link href="/results" className="mz-catalog-link">كل النتائج ←</Link>
          </div>
          <div className="mz-featured-grid">
            {FEATURED.map(([slug, name, english, logo]) => (
              <Link href={"/leagues/" + slug} key={slug} className="mz-featured-card">
                <div className="mz-featured-logo"><img src={logo} alt="" /></div>
                <div><small>{english}</small><strong>{name}</strong><span>المباريات والنتائج والترتيب ←</span></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mz-catalog-section">
          <div className="mz-catalog-section-head">
            <div>
              <span>LIVE DATA CATALOG</span>
              <h2>الدوريات ذات التغطية الحالية</h2>
            </div>
            <span className="mz-catalog-count">{current.length}</span>
          </div>
          {current.length ? (
            <div className="mz-league-grid">
              {current.map((league) => (
                <Link key={league.id} href={"/leagues/catalog/" + catalogSlug(league.id)} className="mz-league-card">
                  <div className="mz-league-mark">{leagueLogo(league) ? <img src={leagueLogo(league)} alt="" loading="lazy" /> : "LG"}</div>
                  <div className="mz-league-info">
                    <strong>{league.name}</strong>
                    <span>{regionLabel(league.region)} · {league.season || "الحالي"}</span>
                    <small>{league.matchCount || 0} مباراة في اللقطة · {league.source || "مصدر مجاني"}</small>
                  </div>
                  <b>←</b>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mz-catalog-empty">لا توجد تغطية حالية إضافية في هذه اللقطة.</div>
          )}
        </section>

        <section className="mz-catalog-section">
          <div className="mz-catalog-section-head">
            <div>
              <span>DISCOVERED COMPETITIONS</span>
              <h2>كتالوج الدوريات المكتشفة</h2>
            </div>
            <span className="mz-catalog-count">{catalog.length}</span>
          </div>
          <p className="mz-catalog-note">نعرض هنا البطولات المكتشفة التي لديها مباريات فعلية في لقطة البيانات الحالية؛ البطولات التي لا تملك مباريات لا ننشئ لها صفحات فارغة.</p>
          <div className="mz-league-grid">
            {catalog.filter((league) => Number(league.matchCount || 0) > 0 && !league.currentCoverage && !featuredIds.has(league.id)).slice(0, 240).map((league) => (
              <Link key={league.id} href={"/leagues/catalog/" + catalogSlug(league.id)} className="mz-league-card mz-league-card-muted">
                <div className="mz-league-mark">LG</div>
                <div className="mz-league-info">
                  <strong>{league.name}</strong>
                  <span>{regionLabel(league.region)} · {league.season || "غير محدد"}</span>
                  <small>{league.file || league.source || "كتالوج"}</small>
                </div>
                <b>←</b>
              </Link>
            ))}
          </div>
        </section>

        <nav className="mz-catalog-nav">
          <Link href="/">الرئيسية</Link>
          <Link href="/matches/today">مباريات اليوم</Link>
          <Link href="/results">النتائج</Link>
          <Link href="/standings/premier-league">الترتيب</Link>
        </nav>
      </div>
    </main>
  );
}
