/**
 * Returns YYYY-MM-DD for a Date object in the user's local timezone.
 * Avoids the critical bug where date.toISOString().split('T')[0] returns yesterday's date
 * in timezones ahead of UTC (e.g. East Africa Time UTC+3).
 */
export const getLocalDateStr = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
