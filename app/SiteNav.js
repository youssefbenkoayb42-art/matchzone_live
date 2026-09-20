"use client";

import { usePathname } from "next/navigation";

const links = [
  ["/", "الرئيسية", "⌂"],
  ["/matches/today", "المباريات", "⚽"],
  ["/leagues", "البطولات", "🏆"],
  ["/stats", "الإحصائيات", "📊"],
];

export default function SiteNav() {
  const pathname = usePathname();

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
              <a key={href} href={href} className={active ? "active" : ""}>
                <span aria-hidden="true">{icon}</span>
                {label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
