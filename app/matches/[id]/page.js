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
      <main style={{ padding: "40px", textAlign: "center" }}>
        <h1>جاري تحميل المباراة...</h1>
      </main>
    );
  }

  if (!match) {
    return (
      <main style={{ padding: "40px", textAlign: "center" }}>
        <h1>لم يتم العثور على المباراة</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", textAlign: "center" }}>
      <h1>
        {match.teams.home.name} ضد {match.teams.away.name}
      </h1>

      <p>{match.league.name}</p>

      <div style={{ display: "flex", justifyContent: "center", gap: "30px", alignItems: "center", marginTop: "30px" }}>
        <div>
          <img
            src={match.teams.home.logo}
            alt={match.teams.home.name}
            style={{ width: "80px", height: "80px", objectFit: "contain" }}
          />
          <h2>{match.teams.home.name}</h2>
        </div>

        <h1>
          {match.goals.home ?? 0} - {match.goals.away ?? 0}
        </h1>

        <div>
          <img
            src={match.teams.away.logo}
            alt={match.teams.away.name}
            style={{ width: "80px", height: "80px", objectFit: "contain" }}
          />
          <h2>{match.teams.away.name}</h2>
        </div>
      </div>
    </main>
  );
      }
