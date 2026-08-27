export default function StatsPage() {
  return (
    <main style={{ padding: "30px 20px", color: "#fff", background: "#0c1a14", minHeight: "100vh", fontFamily: "sans-serif", direction: "rtl" }}>
      
      {/* زر العودة للرئيسية */}
      <a href="/" style={{ color: "#2ecc71", textDecoration: "none", fontWeight: "bold", display: "inline-block", marginBottom: "20px" }}>
        ← العودة للرئيسية
      </a>

      {/* عنوان الصفحة */}
      <h2 style={{ borderBottom: "2px solid #1e3d30", paddingBottom: "10px", marginBottom: "20px" }}>
        📊 إحصائيات كرة القدم الشاملة
      </h2>
      
      <p style={{ color: "#aaa", fontSize: "16px", marginBottom: "30px" }}>
        مرحباً بك في قسم الإحصائيات! قريباً في MatchZone سنقدم تحديثاً فورياً ومباشراً لأرقام اللاعبين والأندية في الدوريات الكبرى...
      </p>

      {/* شبكة عرض الإحصائيات التجريبية الاحترافية */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        
        {/* قائمة الهدافين */}
        <div style={{ background: "#142820", padding: "20px", borderRadius: "12px", border: "1px solid #1e3d30" }}>
          <h4 style={{ margin: "0 0 15px 0", color: "#2ecc71", fontSize: "18px" }}>⚽ صدارة الهدافين (تجريبي)</h4>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: "15px", padding: "10px 0", borderBottom: "1px solid #1e3d30" }}>
            <span>1. إيرلينغ هالاند (مانشستر سيتي)</span>
            <span style={{ fontWeight: "bold", color: "#2ecc71" }}>8 أهداف</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: "15px", padding: "10px 0", borderBottom: "1px solid #1e3d30" }}>
            <span>2. لامين يامال (برشلونة)</span>
            <span style={{ fontWeight: "bold", color: "#2ecc71" }}>5 أهداف</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: "15px", padding: "10px 0" }}>
            <span>3. كيليان مبابي (ريال مدريد)</span>
            <span style={{ fontWeight: "bold", color: "#2ecc71" }}>4 أهداف</span>
          </div>
        </div>

        {/* قائمة صناع اللعب */}
        <div style={{ background: "#142820", padding: "20px", borderRadius: "12px", border: "1px solid #1e3d30" }}>
          <h4 style={{ margin: "0 0 15px 0", color: "#2ecc71", fontSize: "18px" }}>🎯 الأكثر صناعة للأهداف (تجريبي)</h4>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: "15px", padding: "10px 0", borderBottom: "1px solid #1e3d30" }}>
            <span>1. كيفين دي بروين</span>
            <span style={{ fontWeight: "bold", color: "#2ecc71" }}>6 تمريرات</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: "15px", padding: "10px 0", borderBottom: "1px solid #1e3d30" }}>
            <span>2. محمد صلاح</span>
            <span style={{ fontWeight: "bold", color: "#2ecc71" }}>4 تمريرات</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: "15px", padding: "10px 0" }}>
            <span>3. رافينيا</span>
            <span style={{ fontWeight: "bold", color: "#2ecc71" }}>4 تمريرات</span>
          </div>
        </div>

      </div>

      {/* رسالة تنبيه أسفل الصفحة */}
      <div style={{ marginTop: "40px", textAlign: "center", color: "#666", fontSize: "14px" }}>
        🔄 يتم تحديث الأرقام والإحصائيات بعد نهاية كل جولة تلقائياً.
      </div>

    </main>
  );
}
