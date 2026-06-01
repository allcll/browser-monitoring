/**
 * Checks if the current time is within the monitoring schedule.
 */
export function isWithinSchedule(): boolean {
  const now = getKSTDate();

  // YYYY-MM-DD 형식으로 변환
  const kstDateStr = now.getUTCFullYear() + '-' + 
                     String(now.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                     String(now.getUTCDate()).padStart(2, '0');
  const kstHour = now.getUTCHours();

  console.log(`[Schedule Check] KST: ${kstDateStr} ${kstHour}시`);

  // 1. 날짜 범위 체크 (Date 객체로 변환하여 안전하게 비교)
  const { MONITOR_START_DATE, MONITOR_END_DATE } = process.env;

  if (MONITOR_START_DATE) {
    const start = new Date(MONITOR_START_DATE.trim());
    if (!isNaN(start.getTime()) && new Date(kstDateStr) < start) return false;
  }
  if (MONITOR_END_DATE) {
    const end = new Date(MONITOR_END_DATE.trim());
    if (!isNaN(end.getTime()) && new Date(kstDateStr) > end) return false;
  }

  // 2. 시간 범위 체크
  const startHour = parseInt(process.env.MONITOR_START_HOUR || '10', 10);
  const endHour = parseInt(process.env.MONITOR_END_HOUR || '17', 10);

  return !(kstHour < startHour || kstHour >= endHour);
}

/**
 * 한국 시간(KST)을 계산하기 위해 UTC+9시간이 더해진 Date 객체를 반환합니다.
 * 이 객체는 반드시 getUTC... 메서드로 읽어야 합니다.
 */
function getKSTDate() {
  const now = new Date();
  // UTC 기준 밀리초에 9시간을 더함
  return new Date(now.getTime() + (9 * 60 * 60 * 1000));
}