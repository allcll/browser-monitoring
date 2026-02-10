/**
 * Checks if the current time is within the monitoring schedule.
 * The schedule is defined by environment variables.
 */
export function isWithinSchedule(): boolean {
  const now = new Date();
  
  // 1. Check Date Range
  const startDateStr = process.env.MONITOR_START_DATE;
  const endDateStr = process.env.MONITOR_END_DATE;

  if (startDateStr) {
    const startDate = new Date(startDateStr);
    // Reset time to start of day for accurate comparison
    startDate.setHours(0, 0, 0, 0);
    if (now < startDate) return false;
  }

  if (endDateStr) {
    const endDate = new Date(endDateStr);
    // Set time to end of day
    endDate.setHours(23, 59, 59, 999);
    if (now > endDate) return false;
  }

  // 2. Check Day of Week (Mon-Fri)
  // 0 = Sunday, 6 = Saturday
  const day = now.getDay();
  if (day === 0 || day === 6) {
    // Optional: Allow override via env var if needed, but per requirements Mon-Fri only.
    // If we want to support weekend monitoring later, we can add a flag.
    return false;
  }

  // 3. Check Time Range (Hour)
  const startHour = parseInt(process.env.MONITOR_START_HOUR || '10', 10);
  const endHour = parseInt(process.env.MONITOR_END_HOUR || '17', 10);
  const currentHour = now.getHours();

  if (currentHour < startHour || currentHour >= endHour) {
    return false;
  }

  return true;
}
