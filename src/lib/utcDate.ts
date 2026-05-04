const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function endOfUtcDay(date: Date) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23,
    59,
    59,
    999
  ));
}

export function addUtcDays(date: Date, days: number) {
  return new Date(startOfUtcDay(date).getTime() + days * DAY_MS);
}

export function formatUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseUtcDateInput(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export function utcDaySeconds(date: Date) {
  return Math.floor(startOfUtcDay(date).getTime() / 1000);
}
