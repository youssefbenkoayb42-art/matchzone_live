"use client";

import { useState, useEffect } from "react";

export default function StatsPage() {
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTopScorers() {
      try {
        // جلب بيانات هدافي الدوري الإنجليزي الممتاز من API مفتوح ومجاني
        const res = await fetch("https://openligadb.de");
        
        if (!res.ok) {
          throw new Error("فشل في جلب البيانات من الخادم");
        }
        
        const data = await res.json();
        // نأخذ أول 10 هدافين فقط لعرضهم بشكل منظم
        setScorers(data.slice(0, 10));
      } catch (err) {
        console.error("حدث خطأ أثناء جلب الإحصائيات:", err);
        setError("عذراً، تعذر تحميل الإحصائيات حالياً. يرجى المحاولة لاحقاً.");
      } finally {
        setLoading(false);
      }
    }

    fetchTopScorers();
  }, []);

  return (
    <main style={{ padding: "30px 20px", color: "#fff", background: "#0c1a14", minHeight: "100vh", fontFamily: "sans-serif", direction: "rtl" }}>
      
      {/* زر العودة للرئيسية */}
      <a href="/" style={{ color: "#2ecc71", textDecoration: "none", fontWeight: "bold", display: "inline-block", marginBottom: "20px" }}>
        ← العودة للرئيسية
      </a>

      {/* عنوان الصفحة */}
      <h2 style={{ borderBottom: "2px solid #1e3d30", paddingBottom: "10px", marginBottom: "20px" }}>
        📊 إحصائيات كرة القدم الحية
      </h2>
      
      <p style={{ color: "#aaa", fontSize: "16px", marginBottom: "30px" }}>
        تابع أرقام وإحصائيات الهدافين المحدثة تلقائياً ومباشرة فور نهاية كل مباراة.
      </p>

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        
        <div style={{ background: "#142820", padding: "20px", borderRadius: "12px", border: "1px solid #1e3d30" }}>
          <h4 style={{ margin: "0 0 20px 0", color: "#2ecc71", fontSize: "18px", borderBottom: "1px solid #1e3d30", paddingBottom: "10px" }}>
            ⚽ صدارة الهدافين الحالية
          </h4>

          {/* حالة التحميل */}
          {loading && (
            <p style={{ textAlign: "center", color: "#aaa" }}>🔄 جاري جلب الأرقام الحقيقية من الملاعب...</p>
          )}

          {/* حالة حدوث خطأ */}
          {error && (
            <p style={{ textAlign: "center", color: "#ff4d4d" }}>{error}</p>
          )}

          {/* عرض البيانات الحقيقية عند اكتمال التحميل */}
          {!loading && !error && scorers.length > 0 && (
            <div>
              {scorers.map((player, index) => (
                <div 
                  key={player.GoalGetterID || index} 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    color: "#fff", 
                    fontSize: "15px", 
                    padding: "12px 0", 
                    borderBottom: index === scorers.length - 1 ? "none" : "1px solid #1e3d30" 
                  }}
                >
                  <div style={{ display: "flex", gap: "10px" }}>
                    <span style={{ color: "#666", fontWeight: "bold" }}>{index + 1}.</span>
                    <span style={{ fontWeight: "500" }}>{player.GoalGetterName}</span>
                  </div>
                  <span style={{ fontWeight: "bold", color: "#2ecc71", background: "#1c382d", padding: "4px 10px", borderRadius: "15px", fontSize: "13px" }}>
                    {player.GoalCount} أهداف
                  </span>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && scorers.length === 0 && (
            <p style={{ textAlign: "center", color: "#aaa" }}>لا توجد بيانات متاحة حالياً.</p>
          )}

        </div>

      </div>

      <div style={{ marginTop: "40px", textAlign: "center", color: "#666", fontSize: "14px" }}>
        📊 البيانات حية ومربوطة مباشرة بخوادم التحديث الرياضي العالمي.
      </div>

    </main>
  );
}
