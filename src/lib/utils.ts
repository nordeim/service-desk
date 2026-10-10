import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "Oct 9, 2026 at 12:47 AM" — the reference app's date format.
 *  Session 15 (F2): timeZone is pinned to "UTC" — the reference's API
 *  returns NAIVE datetimes ("2026-10-10T04:29:36.328", no Z) that the
 *  browser parses-as-local and formats-as-local, so the digits round-trip
 *  and every viewer sees the STORED UTC wall-clock. Our Z-suffixed ISO
 *  instants render the same digits at every viewer timezone only with the
 *  explicit pin — without it, a Singapore (UTC+8) viewer of ours saw
 *  "12:46 PM" where the reference showed "4:46 AM" for the same ticket
 *  (the paired live measurement; a no-op for UTC viewers). */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(d);
  return `${datePart} at ${timePart}`;
}

/** "Oct 9, 2026" — date-only form used by the reference's dashboard
 *  recent-ticket rows (mytickets cards and the detail panel keep the
 *  full formatDateTime — measured from the live reference, session 3).
 *  Session 15 (F2): timeZone pinned to "UTC" — see formatDateTime above
 *  (the naive round-trip renders the stored wall-clock to every viewer; a
 *  west-of-UTC viewer otherwise saw "Nov 30" for a "Dec 1" UTC day). */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Humanized duration: "3d 4h", "2h 15m", "45m", "N/A". */
export function formatDuration(ms: number | null): string {
  if (ms === null || ms < 0 || !Number.isFinite(ms)) return "N/A";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
