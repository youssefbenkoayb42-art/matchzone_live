"use client";

import { useState, useEffect } from "react";

export default function LeaguesPage() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLeaguesData() {
      try {
        // جلب جدول ترتيب الدوري الإنجليزي الممتاز الحقيقي لعام 2026 من API مفتوح
        const res = await fetch("https://openligadb.de");
        
        if (!res.ok) {
          throw new Error("فشل في الاتصال بخادم البيانات الرياضية");
        }
        
        const data = await res.json();
        setStandings(data);
      } catch (err) {
        console.error("حدث خطأ أثناء جلب البيانات:", err);
        setError("تعذر تحميل جدول الترتيب حالياً. يرجى إعادة المحاولة لاحقاً.");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaguesData();
  }, []);

  return (
    <main style={{ padding: "30px 20px", color: "#fff", background: "#0c1a14", minHeight: "100vh", fontFamily: "sans-serif", direction: "rtl" }}>
      
      {/* زر العودة للرئيسية */}
      <a href="/" style={{ color: "#2ecc71", textDecoration: "none", fontWeight: "bold", display: "inline-block", marginBottom: "20px" }}>
        ← العودة للرئيسية
      </a>

      {/* عنوان الصفحة */}
      <h2 style={{ borderBottom: "2px solid #1e3d30", paddingBottom: "10px", marginBottom: "15px" }}>
        🏆 أهم البطولات العالمية والعربية
      </h2>
      
      <p style={{ color: "#aaa", fontSize: "15px", marginBottom: "30px" }}>
        عرض حي ومباشر لجدول الترتيب، النقاط، وإحصائيات الفرق المحدثة فور نهاية كل جولة [2.1].
      </p>

      {/* قائمة التصفح بين الدوريات */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "25px", overflowX: "auto", paddingBottom: "5px" }}>
        <button style={{ background: "#2ecc71", color: "#0c1a14", border: "none", padding: "8px 18px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}>
          🏴󠁧󠁢󠁥󠁮󠁧󠁿 الدوري الإنجليزي
        </button>
        <button style={{ background: "#142820", color: "#aaa", border: "1px solid #1e3d30", padding: "8px 18px", borderRadius: "20px", cursor: "not-allowed", whiteSpace: "nowrap" }}>
          🇪🇸 الدوري الإسباني (قريباً)
        </button>
      </div>

      {/* واجهة جدول الترتيب */}
      <div style={{ background: "#142820", borderRadius: "12px", border: "1px solid #1e3d30", overflowX: "auto", padding: "10px" }}>
        
        {loading && (
          <p style={{ textAlign: "center", color: "#aaa", padding: "20px 0" }}>🔄 جاري حساب النقاط وترتيب الأندية...</p>
        )}

        {error && (
          <p style={{ textAlign: "center", color: "#ff4d4d", padding: "20px 0" }}>{error}</p>
        )}

        {!loading && !error && standings.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right", minWidth: "500px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #1e3d30", color: "#2ecc71", fontSize: "14px" }}>
                <th style={{ padding: "12px 8px", width: "40px" }}>الترتيب</th>
                <th style={{ padding: "12px 8px" }}>الفريق</th>
                <th style={{ padding: "12px 8px", textAlign: "center" }}>لعب</th>
                <th style={{ padding: "12px 8px", textAlign: "center" }}> +/-</th>
                <th style={{ padding: "12px 8px", textAlign: "center" }}>النقاط</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <tr 
                  key={team.teamId || index} 
                  style={{ 
                    borderBottom: "1px solid #1e3d30", 
                    fontSize: "15px",
                    background: index < 4 ? "rgba(46, 204, 113, 0.03)" : "none"
                  }}
                >
                  <td style={{ padding: "12px 8px", fontWeight: "bold", color: index < 4 ? "#2ecc71" : "#666" }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: "12px 8px", display: "flex", alignItems: "center", gap: "10px" }}>
                    {team.teamIconUrl && (
                      <img src={team.teamIconUrl} alt={team.teamName} style={{ width: "24px", height: "24px", objectFit: "contain" }} />
                    )}
                    <span style={{ fontWeight: "500" }}>{team.teamName}</span>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#aaa" }}>
                    {team.matches}
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: team.opponentGoals > 0 ? "#aaa" : "#ff4d4d" }}>
                    {team.goals - team.opponentGoals}
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: "bold", color: "#fff" }}>
                    {team.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

    </main>
  );
}
