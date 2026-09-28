import Link from "next/link";
import { getTeamCatalog, getTeamById, getTeamMatches, getMatchSnapshotMeta } from "../../lib/match-snapshot";

export const dynamic = "force-dynamic";

const done=(m)=>["FT","AET","PEN","FINISHED"].includes(String(m?.fixture?.status?.short||"").toUpperCase());

export default async function TeamsPage({searchParams}) {
  const id=String(searchParams?.team||"");
  const [teams,meta,team,matches]=await Promise.all([getTeamCatalog(),getMatchSnapshotMeta(),id?getTeamById(id):null,id?getTeamMatches(id):[]]);

  if(team){
    const ordered=[...matches].sort((a,b)=>new Date(b?.fixture?.date||0)-new Date(a?.fixture?.date||0));
    const results=ordered.filter(done).slice(0,10);
    const upcoming=ordered.filter(m=>!done(m)).reverse().slice(0,8);
    return <main dir="rtl" style={{minHeight:"100vh",background:"#07100d",color:"#f4f8f6",padding:24}}><div style={{maxWidth:1000,margin:"auto"}}>
      <Link href="/teams" style={{color:"#37e28a"}}>← الفرق</Link>
      <section style={{marginTop:18,padding:24,background:"#0b1713",border:"1px solid #284238",borderRadius:24}}>
        {team.logo&&<img src={team.logo} alt="" style={{width:80,height:80,objectFit:"contain"}}/>}
        <h1>{team.name}</h1><p style={{color:"#82968d"}}>{team.provider} · {team.id}</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8}}>
          <b>مباريات {team.stats.played}</b><b>فوز {team.stats.wins}</b><b>تعادل {team.stats.draws}</b><b>هزيمة {team.stats.losses}</b><b>نقاط {team.stats.points}</b><b>فرق {team.stats.goalDifference}</b>
        </div>
      </section>
      <section style={{marginTop:18}}><h2>المباريات القادمة</h2>{upcoming.map(m=><Link key={m.fixture?.id} href={"/matches/"+encodeURIComponent(m.fixture?.id||"")} style={{display:"block",padding:12,margin:"7px 0",background:"#0b1713",borderRadius:12,color:"#fff",textDecoration:"none"}}>{m.teams?.home?.name} — {m.goals?.home??"—"} : {m.goals?.away??"—"} — {m.teams?.away?.name}</Link>)}</section>
      <section style={{marginTop:18}}><h2>آخر النتائج</h2>{results.map(m=><Link key={m.fixture?.id} href={"/matches/"+encodeURIComponent(m.fixture?.id||"")} style={{display:"block",padding:12,margin:"7px 0",background:"#0b1713",borderRadius:12,color:"#fff",textDecoration:"none"}}>{m.teams?.home?.name} — {m.goals?.home??"—"} : {m.goals?.away??"—"} — {m.teams?.away?.name}</Link>)}</section>
      <section style={{marginTop:18,padding:20,background:"#0b1713",borderRadius:18}}><h2>إحصائيات الفريق</h2><p>الأهداف: {team.stats.goalsFor} · المستقبلة: {team.stats.goalsAgainst} · الشباك النظيفة: {team.stats.cleanSheets}</p><p style={{color:"#82968d"}}>الإحصائيات محسوبة من لقطة MatchZone الحالية.</p></section>
    </div></main>;
  }

  const visible=teams.filter(t=>t.matchCount>0);
  return <main className="mz-teams-page" dir="rtl"><div className="mz-teams-shell"><Link href="/leagues" className="mz-catalog-back">← دليل الدوريات</Link><header className="mz-teams-hero"><span className="mz-catalog-kicker">MATCHZONE • TEAMS</span><h1>دليل الفرق</h1><p>الهوية تعتمد على معرف المزود، وليس اسم الفريق.</p><div className="mz-teams-stats"><div><strong>{visible.length}</strong><span>فريق</span></div><div><strong>{meta.counts?.total||0}</strong><span>مباراة</span></div></div></header><section className="mz-team-grid">{visible.map(t=><Link key={t.id} href={"/teams?team="+encodeURIComponent(t.id)} className="mz-team-card"><div className="mz-team-card-logo">{t.logo?<img src={t.logo} alt=""/>:<span>FC</span>}</div><div><h2>{t.name}</h2><span>{t.provider}</span><div>{t.matchCount} مباراة · {t.stats.points} نقطة</div></div></Link>)}</section></div></main>;
}
