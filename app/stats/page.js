"use client";

import { useEffect, useMemo, useState } from "react";

const LIVE = new Set(["LIVE","1H","2H","HT","ET","BT","P","INT"]);
const FINISHED = new Set(["FT","AET","PEN"]);

function statusOf(match) {
  return match?.fixture?.status?.short || "NS";
}

export default function StatsPage() {
  const [matches, setMatches] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/football", { cache: "no-store" });
        if (!res.ok) throw new Error("stats request failed");
        const data = await res.json();

        if (!cancelled) {
          setMatches(Array.isArray(data?.response) ? data.response : []);
          setUpdatedAt(data?.updatedAt || null);
        }
      } catch (err) {
        console.error("Stats error:", err);
        if (!cancelled) {
          setError("تعذر تحميل إحصائيات اليوم حالياً. حاول تحديث الصفحة.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const live = matches.filter((m) => LIVE.has(statusOf(m)));
    const finished = matches.filter((m) => FINISHED.has(statusOf(m)));
    const upcoming = matches.filter(
      (m) => !LIVE.has(statusOf(m)) && !FINISHED.has(statusOf(m))
    );

    const goals = finished.reduce((sum, match) => {
      const home = Number.isFinite(match?.goals?.home) ? match.goals.home : 0;
      const away = Number.isFinite(match?.goals?.away) ? match.goals.away : 0;
      return sum + home + away;
    }, 0);

    const leagues = new Map();
    matches.forEach((match) => {
      const name =
        match?.arabicLeague || match?.league?.name || "بطولة أخرى";
      leagues.set(name, (leagues.get(name) || 0) + 1);
    });

    return {
      total: matches.length,
      live: live.length,
      finished: finished.length,
      upcoming: upcoming.length,
      goals,
      leagues: [...leagues.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8),
    };
  }, [matches]);

  const cards = [
    ["🏟️", "إجمالي المباريات", stats.total],
    ["🔴", "مباشرة الآن", stats.live],
    ["⏳", "قادمة", stats.upcoming],
    ["✅", "منتهية", stats.finished],
    ["⚽", "الأهداف", stats.goals],
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "30px 20px 50px",
        background: "#0c1a14",
        color: "#fff",
        direction: "rtl",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <a
          href="/"
          style={{
            color: "#2ecc71",
            textDecoration: "none",
            fontWeight: "bold",
            display: "inline-block",
            marginBottom: 20,
          }}
        >
          ← العودة للرئيسية
        </a>

        <h1
          style={{
            borderBottom: "2px solid #1e3d30",
            paddingBottom: 12,
            marginBottom: 10,
          }}
        >
          📊 إحصائيات مباريات اليوم
        </h1>

        <p style={{ color: "#aaa", lineHeight: 1.8, marginBottom: 28 }}>
          ملخص حقيقي للمباريات التي يعرضها MatchZone، بدون الاعتماد على مصدر
          إحصائيات وهمي أو بيانات تجريبية.
        </p>

        {loading && (
          <section style={box}>
            <p style={message}>🔄 جاري تحميل الإحصائيات...</p>
          </section>
        )}

        {!loading && error && (
          <section style={{ ...box, borderColor: "#5b2929" }}>
            <p style={{ ...message, color: "#ff8b8b" }}>{error}</p>
          </section>
        )}

        {!loading && !error && (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {cards.map(([icon, label, value]) => (
                <div key={label} style={card}>
                  <div style={{ fontSize: 24 }}>{icon}</div>
                  <div style={{ color: "#aaa", fontSize: 13, marginTop: 7 }}>
                    {label}
                  </div>
                  <strong
                    style={{
                      display: "block",
                      color: "#2ecc71",
                      fontSize: 25,
                      marginTop: 4,
                    }}
                  >
                    {value}
                  </strong>
                </div>
              ))}
            </section>

            <section style={box}>
              <h2 style={{ margin: "0 0 15px", fontSize: 19 }}>
                🏆 المباريات حسب البطولة
              </h2>

              {stats.leagues.length === 0 ? (
                <p style={{ color: "#aaa" }}>لا توجد مباريات متاحة اليوم.</p>
              ) : (
                stats.leagues.map(([name, count], index) => (
                  <div
                    key={name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom:
                        index === stats.leagues.length - 1
                          ? "none"
                          : "1px solid #1e3d30",
                    }}
                  >
                    <span>{name}</span>
                    <span
                      style={{
                        color: "#2ecc71",
                        background: "#1c382d",
                        padding: "5px 10px",
                        borderRadius: 999,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {count} مباراة
                    </span>
                  </div>
                ))
              )}
            </section>

            <section
              style={{
                ...box,
                marginTop: 20,
                color: "#aaa",
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              <strong style={{ color: "#fff" }}>مصدر الأرقام:</strong> نفس
              واجهة المباريات الداخلية في MatchZone، لذلك تتحدث هذه الصفحة مع
              تحديث بيانات المباريات.
              {updatedAt && (
                <div style={{ marginTop: 6 }}>
                  آخر تحديث: {new Date(updatedAt).toLocaleString("ar-MA")}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const box = {
  background: "#142820",
  border: "1px solid #1e3d30",
  borderRadius: 16,
  padding: 20,
};

const card = {
  ...box,
  textAlign: "center",
  padding: "18px 12px",
};

const message = {
  textAlign: "center",
  color: "#aaa",
  margin: 0,
};
