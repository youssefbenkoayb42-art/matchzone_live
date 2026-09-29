"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  ["/", "الرئيسية", "⌂"],
  ["/matches/today", "المباريات", "◉"],
  ["/leagues", "البطولات", "◇"],
  ["/international", "العالمية", "◎"],
  ["/stats", "الإحصائيات", "▦"],
  ["/favorites", "المفضلة", "✦"],
];

export default function SiteNav() {
  const pathname = usePathname();
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    const loadCount = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("matchzone-favorite-teams") || "[]");
        setFavoriteCount(Array.isArray(saved) ? saved.length : 0);
      } catch {
        setFavoriteCount(0);
      }
    };

    loadCount();
    window.addEventListener("storage", loadCount);
    window.addEventListener("matchzone-favorites-updated", loadCount);
    return () => {
      window.removeEventListener("storage", loadCount);
      window.removeEventListener("matchzone-favorites-updated", loadCount);
    };
  }, []);

  if (pathname === "/") return null;

  return (
    <nav className="site-nav" aria-label="التنقل الرئيسي">
      <div className="site-nav-inner">
        <a href="/" className="site-nav-brand" aria-label="العودة إلى MatchZone">
          <img src="/logo.svg" alt="" />
          <span>MatchZone</span>
        </a>

        <div className="site-nav-links">
          {links.map(([href, label, icon]) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");
            return (
              <a
                key={href}
                href={href}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-glyph" aria-hidden="true">{icon}</span>
                {label}
                {href === "/favorites" && favoriteCount > 0 ? (
                  <span className="site-nav-badge" aria-label="عدد الفرق المفضلة">
                    {favoriteCount > 99 ? "99+" : favoriteCount}
                  </span>
                ) : null}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
