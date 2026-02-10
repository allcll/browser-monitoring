/**
 * Calculates the difference in milliseconds between two dates.
 * @param from - The start date (usually the crawled time).
 * @param to - The end date (usually the current time).
 * @returns The difference in milliseconds.
 */
export function calculateTimeDiff(from: number | Date, to: number | Date = Date.now()): number {
  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();
  return toTime - fromTime;
}

/**
 * Parses a relative time string (e.g., "5분 전") into a structured object.
 * @param relativeTimeStr - The relative time string to parse.
 * @returns An object containing the value and unit, or null if parsing fails.
 */
export function parseRelativeTime(relativeTimeStr: string): { value: number; unit: 'second' | 'minute' | 'hour' } | null {
  const match = relativeTimeStr.match(/^(\d+)(초|분|시간)\s*전$/);
  if (!match) {
    return null;
  }

  const value = parseInt(match[1], 10);
  const unitStr = match[2];

  let unit: 'second' | 'minute' | 'hour';
  switch (unitStr) {
    case '초':
      unit = 'second';
      break;
    case '분':
      unit = 'minute';
      break;
    case '시간':
      unit = 'hour';
      break;
    default:
      return null;
  }

  return { value, unit };
}

/**
 * Verifies if the relative time string logically matches the time difference.
 * Note: This is a loose check as per requirements (exact number match is not required, just logical consistency).
 * @param diffMs - The time difference in milliseconds.
 * @param relativeTimeStr - The relative time string displayed in UI.
 * @returns True if the unit matches the difference range.
 */
export function isRelativeTimeValid(diffMs: number, relativeTimeStr: string): boolean {
  const parsed = parseRelativeTime(relativeTimeStr);
  if (!parsed) return false;

  const seconds = diffMs / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;

  if (seconds < 60) {
    return parsed.unit === 'second';
  } else if (minutes < 60) {
    return parsed.unit === 'minute';
  } else {
    return parsed.unit === 'hour';
  }
}
