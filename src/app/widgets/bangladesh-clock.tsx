"use client";

import { useEffect, useState } from "react";

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function BangladeshClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <article className="card clock-widget" aria-live="off">
      <p className="eyebrow">Bangladesh time</p>
      <p className="clock-time">{now ? formatTime(now) : "—:—"}</p>
      <p>{now ? formatDate(now) : "Local date and time"}</p>
    </article>
  );
}
