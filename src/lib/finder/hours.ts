/**
 * Open-now is only computed when hours are reliable:
 * is24_7 === true, or a parseable weekly window list.
 * A free-text hours summary alone is not enough.
 */

export type WeeklyWindow = {
  day: number;
  openMinutes: number;
  closeMinutes: number;
};

const TIME = /^(\d{1,2}):(\d{2})$/;

function parseClock(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = TIME.exec(value.trim());
  if (!match) return null;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function parseDay(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6) {
    return value;
  }
  if (typeof value !== "string") return null;
  const named: Record<string, number> = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6,
  };
  const key = value.trim().toLowerCase();
  if (key in named) return named[key];
  const numeric = Number.parseInt(key, 10);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 6) return numeric;
  return null;
}

export function parseStructuredHours(value: unknown): WeeklyWindow[] | null {
  if (!value || typeof value !== "object") return null;
  const weekly = Array.isArray(value)
    ? value
    : Array.isArray((value as { weekly?: unknown }).weekly)
      ? ((value as { weekly: unknown[] }).weekly)
      : null;
  if (!weekly || weekly.length === 0) return null;

  const windows: WeeklyWindow[] = [];
  for (const row of weekly) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const day = parseDay(record.day ?? record.weekday);
    const openMinutes = parseClock(record.open ?? record.openTime ?? record.start);
    const closeMinutes = parseClock(record.close ?? record.closeTime ?? record.end);
    if (day === null || openMinutes === null || closeMinutes === null) continue;
    windows.push({ day, openMinutes, closeMinutes });
  }
  return windows.length > 0 ? windows : null;
}

export function hoursAreReliable(input: {
  is24_7?: boolean | null;
  hoursStructured?: unknown;
}): boolean {
  if (input.is24_7 === true) return true;
  return parseStructuredHours(input.hoursStructured) !== null;
}

function indiaClock(at: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const hour = Number.parseInt(parts.find((part) => part.type === "hour")?.value ?? "0", 10);
  const minute = Number.parseInt(parts.find((part) => part.type === "minute")?.value ?? "0", 10);
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return { day: dayMap[weekday] ?? 0, minutes: hour * 60 + minute };
}

function windowContains(window: WeeklyWindow, day: number, minutes: number): boolean {
  if (window.closeMinutes > window.openMinutes) {
    return window.day === day && minutes >= window.openMinutes && minutes < window.closeMinutes;
  }
  if (window.closeMinutes === window.openMinutes) {
    return window.day === day;
  }
  if (window.day === day && minutes >= window.openMinutes) return true;
  const nextDay = (window.day + 1) % 7;
  return day === nextDay && minutes < window.closeMinutes;
}

/** true/false when hours are reliable; null when open-now must not be claimed. */
export function isOpenAt(
  input: {
    is24_7?: boolean | null;
    hoursStructured?: unknown;
  },
  at: Date = new Date(),
): boolean | null {
  if (input.is24_7 === true) return true;
  const windows = parseStructuredHours(input.hoursStructured);
  if (!windows) return null;
  const clock = indiaClock(at);
  return windows.some((window) => windowContains(window, clock.day, clock.minutes));
}
