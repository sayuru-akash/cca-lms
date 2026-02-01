"use client";

import { useState, useEffect } from "react";
import { getServerTime } from "@/lib/utils";

export function RealTimeClock() {
  const [currentTime, setCurrentTime] = useState(getServerTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getServerTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-terminal-text-muted text-sm font-mono">
      {currentTime.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })}{" "}
      {currentTime.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })}{" "}
      <span className="text-terminal-green">(UTC+5:30)</span>
    </div>
  );
}
