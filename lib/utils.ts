import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/**
 * Get current server time in Sri Lanka timezone (UTC+5:30)
 * Use this instead of new Date() for consistent server time across all users
 */
export function getServerTime(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }),
  );
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
