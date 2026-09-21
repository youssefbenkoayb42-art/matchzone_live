"use client";

import { useEffect, useState } from "react";

export default function TeamFavorite({ teamName }) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("matchzone-favorite-teams") || "[]");
      setFavorite(Array.isArray(saved) && saved.includes(teamName));
    } catch {}
  }, [teamName]);

  function toggle() {
    try {
      const saved = JSON.parse(localStorage.getItem("matchzone-favorite-teams") || "[]");
      const list = Array.isArray(saved) ? saved : [];
      const next = list.includes(teamName)
        ? list.filter((name) => name !== teamName)
        : [...list, teamName];
      localStorage.setItem("matchzone-favorite-teams", JSON.stringify(next));
      setFavorite(next.includes(teamName));
    } catch {}
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={favorite}
      style={{ marginTop: 14, border: "1px solid rgba(255,215,90,.22)", borderRadius: 12, padding: "10px 15px", background: favorite ? "rgba(255,215,90,.1)" : "rgba(255,255,255,.04)", color: favorite ? "#ffd75a" : "#c2cec8", cursor: "pointer", fontWeight: 800 }}>
      {favorite ? "★ فريقك المفضل" : "☆ أضف إلى المفضلة"}
    </button>
  );
}