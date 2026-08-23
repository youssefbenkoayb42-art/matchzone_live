"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function MatchPage() {
  const params = useParams();
  const id = params.id;

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function getMatch() {
      try {
        const response = await fetch(`/api/match/${id}`);
        const data = await response.json();

        if (data.response && data.response.length > 0) {
          setMatch(data.response[0]);
        }
      } catch (error) {
        console.error("Error loading match:", error);
      } finally {
        setLoading(false);
      }
    }

    getMatch();
  }, [id]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#07100d",
          color: "#f4f8f6",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <h1>جاري تحميل المباراة...</h1>
      </main>
    );
  }

  if (!match) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#07100d",
          color: "#f4f8f6",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <h1>لم يتم العثور على المباراة</h1>
      </main>
    );
  }

  const matchStatus = match.fixture.status.short;

const isLive = ["1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(
  matchStatus
);

const status =
  matchStatus === "FT"
    ? "انتهت المباراة"
    : isLive
    ? "🔴 مباشر الآن"
    : "لم تبدأ";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07100d",
        color: "#f4f8f6",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a
          href="/"
          style={{
            display: "inline-block",
            color: "#37e28a",
            textDecoration: "none",
            marginBottom: "30px",
            fontWeight: "700",
          }}
        >
          ← العودة إلى المباريات
        </a>

        <div
          style={{
            background: "linear-gradient(145deg, #10251c, #0b1713)",
            border: "1px solid #284238",
            borderRadius: "25px",
            padding: "35px 20px",
            textAlign: "center",
            boxShadow: "0 25px 80px #0008",
          }}
        >
          <p
            style={{
              color: "#37e28a",
              fontWeight: "700",
              marginBottom: "10px",
            }}
          >
            🏆 {match.league.name}
          </p>

          <p style={{ color: "#82968d", marginBottom: "35px" }}>
            {status}
          </p>

          <div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px",
    flexWrap: "nowrap",
  }}
>
            <div>
              <img
                src={match.teams.home.logo}
                alt={match.teams.home.name}
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "contain",
                }}
              />
              <h2 style={{ marginTop: "15px" }}>
                {match.teams.home.name}
              </h2>
            </div>

            <div>
              <div
                style={{
                  fontSize: "42px",
                  fontWeight: "900",
                  color: "#37e28a",
                }}
              >
                {match.goals.home ?? 0} - {match.goals.away ?? 0}
              </div>

              <p style={{ color: "#82968d", marginTop: "10px" }}>
                {new Date(match.fixture.date).toLocaleTimeString("ar-MA", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div>
              <img
                src={match.teams.away.logo}
                alt={match.teams.away.name}
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "contain",
                }}
              />
              <h2 style={{ marginTop: "15px" }}>
                {match.teams.away.name}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
