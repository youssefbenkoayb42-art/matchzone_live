"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "INT"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

export default function LiveMatchRefresh({ matchId, initialStatus, initialHome, initialAway }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [latestScore, setLatestScore] = useState({ home: initialHome, away: initialAway });
  const [latestStatus, setLatestStatus] = useState(initialStatus);

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

        const nextStatus = latest.fixture?.status?.short || "NS";
        const latestHome = latest.goals?.home ?? null;
        const latestAway = latest.goals?.away ?? null;
        setLatestScore({ home: latestHome, away: latestAway });
        setLatestStatus(nextStatus);

        if (
          nextStatus !== initialStatus ||
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

    // لا حاجة لاستدعاءات إضافية بعد انتهاء المباراة.
    // للمباريات القادمة نستخدم فحصًا أبطأ لتقليل الضغط على الـ API.
    const interval = FINISHED_STATUSES.has(initialStatus)
      ? null
      : window.setInterval(checkMatch, isLive ? 30000 : 60000);

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [matchId, initialStatus, initialHome, initialAway, router]);

  const liveNow = LIVE_STATUSES.has(latestStatus);
  const finishedNow = FINISHED_STATUSES.has(latestStatus);
  const statusText = liveNow
    ? "🔴 تحديث مباشر كل 30 ثانية"
    : finishedNow
      ? "✅ المباراة انتهت"
      : "🔄 تحديث تلقائي كل 60 ثانية";

  const handleManualRefresh = () => {
    if (checking) return;
    router.refresh();
  };

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
        background: liveNow ? "#35191b" : "#0b1713",
        border: "1px solid #284238",
        color: liveNow ? "#ff9a9a" : "#82968d",
        fontSize: "12px",
        fontWeight: "700",
      }}
    >
      <span>{checking ? "⏳" : liveNow ? "🔴" : finishedNow ? "✅" : "●"}</span>
      <span>{statusText}</span>
      {liveNow && (
        <strong style={{ direction: "ltr", fontSize: "14px" }}>
          {latestScore.home ?? "—"} - {latestScore.away ?? "—"}
        </strong>
      )}
      <button
        type="button"
        onClick={handleManualRefresh}
        disabled={checking}
        aria-label="تحديث المباراة الآن"
        style={{
          border: "1px solid #365548",
          background: "#07100d",
          color: "#f4f8f6",
          borderRadius: "999px",
          padding: "5px 9px",
          cursor: checking ? "wait" : "pointer",
          fontSize: "11px",
          fontWeight: "800",
        }}
      >
        ↻ تحديث
      </button>
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
