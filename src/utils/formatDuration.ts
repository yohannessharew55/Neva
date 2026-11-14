/**
 * Formats task duration according to user specification:
 * - Under 1 hour (< 60 min): displayed in minutes (e.g., "20m", "45m", "30m")
 * - 1 hour and above (>= 60 min): displayed in hours with minutes as decimal (e.g., "1h", "1.30h" for 1h 30m, "2.15h")
 */
export function formatTaskDuration(durationMin: number): string {
  const min = Math.round(durationMin || 0);
  if (min <= 0) return '0m';
  if (min < 60) {
    return `${min}m`;
  }
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  if (remMin === 0) {
    return `${hours}h`;
  }
  const remStr = remMin < 10 ? `0${remMin}` : `${remMin}`;
  return `${hours}.${remStr}h`;
}
