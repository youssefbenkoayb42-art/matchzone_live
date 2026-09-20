"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "INT"]);

export default function LiveMatchRefresh({ matchId, initialStatus, initialHome, initialAway }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const isLive = useMemo(() => LIVE_STATUSES.has(initialStatus), [initialStatus]);

  useEffect(() => {
    let cancelled = false;

    const checkMatch = async () => {
      if (cancelled) return;

      setChecking(true);
      try {
        const response = await fetch(`/api/match/${encodeURIComponent(matchId)}`, {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();
        const latest = data?.fixture ? data : data?.response?.[0];

        if (!latest) return;

        setLastChecked(new Date());

        const latestStatus = latest.fixture?.status?.short || "NS";
        const latestHome = latest.goals?.home ?? null;
        const latestAway = latest.goals?.away ?? null;

        if (
          latestStatus !== initialStatus ||
          latestHome !== initialHome ||
          latestAway !== initialAway
        ) {
          router.refresh();
        }
      } catch {
        // لا نعرض خطأ للمستخدم بسبب فشل تحديث ثانوي.
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    checkMatch();
    const interval = window.setInterval(checkMatch, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [matchId, initialStatus, initialHome, initialAway, router]);

  const statusText = isLive
    ? "🔴 يتم التحقق من النتيجة مباشرة"
    : "🔄 تحديث تلقائي كل 30 ثانية";

  return (
    <div
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "12px",
        padding: "8px 12px",
        borderRadius: "999px",
        background: isLive ? "#35191b" : "#0b1713",
        border: "1px solid #284238",
        color: isLive ? "#ff9a9a" : "#82968d",
        fontSize: "12px",
        fontWeight: "700",
      }}
    >
      <span>{checking ? "⏳" : "●"}</span>
      <span>{statusText}</span>
      {lastChecked && (
        <span>
          • آخر فحص {lastChecked.toLocaleTimeString("ar-MA", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
    </div>
  );
}
