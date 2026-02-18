/**
 * Time tracking utility functions
 */

/**
 * Parses a time string "HH:MM" or "HH:MM:SS" into total minutes from midnight.
 */
export function timeToMinutes(time: string | null | undefined): number {
  if (!time) return 0;
  const parts = time.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Converts minutes to a formatted string "Xh Ym".
 */
export function minutesToString(minutes: number): string {
  const absMin = Math.abs(minutes);
  const h = Math.floor(absMin / 60);
  const m = absMin % 60;
  const sign = minutes < 0 ? '-' : '';
  if (h === 0) return `${sign}${m}min`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}min`;
}

/**
 * Calculates worked minutes from a time entry.
 * Subtracts lunch break from total span.
 */
export function calcWorkedMinutes(entry: {
  clock_in: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  clock_out: string | null;
}): number {
  if (!entry.clock_in || !entry.clock_out) return 0;

  const inMin = timeToMinutes(entry.clock_in);
  const outMin = timeToMinutes(entry.clock_out);
  let worked = outMin - inMin;

  if (entry.lunch_start && entry.lunch_end) {
    const lunchStartMin = timeToMinutes(entry.lunch_start);
    const lunchEndMin = timeToMinutes(entry.lunch_end);
    const lunchDuration = lunchEndMin - lunchStartMin;
    if (lunchDuration > 0) {
      worked -= lunchDuration;
    }
  }

  return Math.max(0, worked);
}

/**
 * Calculates overtime (positive) or negative hours in minutes.
 * expectedHours in decimal format (e.g. 8.0 = 8 hours)
 */
export function calcBalanceMinutes(
  workedMinutes: number,
  expectedHours: number
): number {
  const expectedMinutes = Math.round(expectedHours * 60);
  return workedMinutes - expectedMinutes;
}

/**
 * Formats a balance in minutes as "+Xh Ym" or "-Xh Ym".
 */
export function formatBalance(minutes: number): string {
  if (minutes === 0) return '0h';
  const prefix = minutes > 0 ? '+' : '-';
  return prefix + minutesToString(minutes);
}

/**
 * Formats time string "HH:MM:SS" → "HH:MM".
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return '--:--';
  return time.slice(0, 5);
}

/**
 * Gets the current time as "HH:MM".
 */
export function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Gets today's date as "YYYY-MM-DD".
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Returns status label for a time entry.
 */
export function getEntryStatus(entry: {
  clock_in: string | null;
  clock_out: string | null;
}): 'pending' | 'in-progress' | 'complete' {
  if (!entry.clock_in) return 'pending';
  if (!entry.clock_out) return 'in-progress';
  return 'complete';
}

/**
 * Formats a date string "YYYY-MM-DD" to "DD/MM/YYYY".
 */
export function formatDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Returns week number of a date.
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
