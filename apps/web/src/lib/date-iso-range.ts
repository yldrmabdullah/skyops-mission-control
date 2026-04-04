/** Interpret `yyyy-MM-dd` in local time, return ISO instant at start of that day. */
export function localDateToStartOfDayIso(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

/** Interpret `yyyy-MM-dd` in local time, return ISO instant at end of that day. */
export function localDateToEndOfDayIso(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59`).toISOString();
}
