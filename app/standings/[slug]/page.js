import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "node:fs/promises";
import pathNode from "node:path";

export const dynamic = "force-dynamic";
const BASE = "https://matchzone-live.vercel.app";

const LEGACY = {
  "premier-league": ["eng.1", "الدوري الإنجليزي الممتاز"],
  "la-liga": ["esp.1", "الدوري الإسباني"],
  "serie-a": ["ita.1", "الدوري الإيطالي"],
  "bundesliga": ["ger.1", "الدوري الألماني"],
  "ligue-1": ["fra.1", "الدوري الفرنسي"],
};

async function getSnapshot() {
  try {
    const raw = await fs.readFile(pathNode.join(process.cwd(), "data", "scraped-matches.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resolveLeague(slug, snapshot) {
  if (LEGACY[slug]) {
    const [code, name] = LEGACY[slug];
    return { code, name };
  }
  const value = decodeURIComponent(String(slug || ""));
  const code = value.startsWith("espn:") ? value.slice(5) : value;
  const item = Array.isArray(snapshot?.leagues)
    ? snapshot.leagues.find((league) => String(league.id) === "espn:" + code)
    : null;
  return item ? { code, name: item.name || code } : null;
}

function cell(value) {
  return value === null || value === undefined || value === "" ? "—" : value;
}

export async function generateMetadata({ params }) {
  const snapshot = await getSnapshot();
  const league = resolveLeague(params.slug, snapshot);
  if (!league) return { title: "الترتيب غير متاح | MatchZone" };
  return {
    title: "ترتيب " + league.name + " | MatchZone",
    description: "جدول ترتيب " + league.name + " مع النقاط والانتصارات والتعادلات والهزائم وفارق الأهداف.",
    alternates: { canonical: BASE + "/standings/" + encodeURIComponent(params.slug) },
  };
}

export default async function StandingsPage({ params }) {
  const snapshot = await getSnapshot();
  const league = resolveLeague(params.slug, snapshot);
  if (!league) notFound();

  const standing = snapshot?.standings?.[league.code] || null;
  const groups = Array.isArray(standing?.groups) ? standing.groups : [];

  return (
    <main className="mz-standings-page" dir="rtl">
      <div className="mz-standings-shell">
        <div className="mz-standings-topbar">
          <Link href={"/leagues/" + encodeURIComponent(params.slug)} className="mz-catalog-back">← صفحة البطولة</Link>
          <Link href="/leagues" className="mz-catalog-back">كل البطولات</Link>
        </div>

        <header className="mz-standings-hero">
          <div>
            <span className="mz-catalog-kicker">MATCHZONE • STANDINGS</span>
            <h1>ترتيب {league.name}</h1>
            <p>جدول الترتيب من لقطة البيانات المخزنة في MatchZone، بدون طلب مباشر من الزائر إلى مزود خارجي.</p>
          </div>
          <div className="mz-standings-season">
            <span>الموسم</span>
            <strong>{standing?.season?.displayName || "2026-27"}</strong>
          </div>
        </header>

        {groups.length ? groups.map((group, groupIndex) => (
          <section className="mz-standings-section" key={group.name + groupIndex}>
            <div className="mz-section-heading">
              <div>
                <span className="mz-catalog-kicker">TABLE</span>
                <h2>{group.name || "الترتيب"}</h2>
              </div>
              <span>{group.entries.length} فريقًا</span>
            </div>

            <div className="mz-table-wrap">
              <table className="mz-standings-table">
                <thead>
                  <tr><th>#</th><th>الفريق</th><th>لعب</th><th>ف</th><th>ت</th><th>خ</th><th>له</th><th>عليه</th><th>+/-</th><th>نقاط</th></tr>
                </thead>
                <tbody>
                  {group.entries.map((entry, index) => (
                    <tr key={entry.team?.id || entry.team?.name || index}>
                      <td className="mz-rank">{index + 1}</td>
                      <td className="mz-standing-team">
                        {entry.team?.logo ? <img src={entry.team.logo} alt="" loading="lazy" /> : <span>FC</span>}
                        <strong>{entry.team?.name || "فريق"}</strong>
                      </td>
                      <td>{cell(entry.played)}</td>
                      <td>{cell(entry.wins)}</td>
                      <td>{cell(entry.draws)}</td>
                      <td>{cell(entry.losses)}</td>
                      <td>{cell(entry.goalsFor)}</td>
                      <td>{cell(entry.goalsAgainst)}</td>
                      <td>{cell(entry.goalDifference)}</td>
                      <td className="mz-points">{cell(entry.points)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )) : (
          <section className="mz-standings-empty">
            <strong>الترتيب غير متاح في اللقطة الحالية</strong>
            <p>لم تصل بيانات ترتيب هذه البطولة بعد. سيحاول نظام التحديث الدوري جلبها تلقائيًا في دورة التحديث التالية.</p>
            <Link href={"/leagues/" + encodeURIComponent(params.slug)}>العودة إلى صفحة البطولة</Link>
          </section>
        )}

        <nav className="mz-standings-nav">
          <Link href={"/leagues/" + encodeURIComponent(params.slug)}>المباريات</Link>
          <Link href="/results">النتائج</Link>
          <Link href="/teams">الفرق</Link>
          <Link href="/leagues">البطولات</Link>
        </nav>
      </div>
    </main>
  );
}
