import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/**
 * Get current server time in Sri Lanka timezone (UTC+5:30)
 * Use this instead of new Date() for consistent server time across all users
 * Works correctly on Vercel serverless functions
 */
export function getServerTime(): Date {
  const now = new Date();
  // Get Sri Lanka time offset: UTC+5:30 = 330 minutes
  const SL_OFFSET_MINUTES = 330;
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcTime + SL_OFFSET_MINUTES * 60000);
}

/**
 * Format date for Sri Lankan timezone display
 */
export function formatServerDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("en-US", {
    timeZone: "Asia/Colombo",
    ...options,
  });
}
