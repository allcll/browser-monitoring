/**
 * Checks if the current time is within the monitoring schedule.
 */
export function isWithinSchedule(): boolean {
  const now = getKSTDate();

  // 1. 한국 기준 날짜 문자열(YYYY-MM-DD)과 시간(0-23) 추출
  const kstDateStr = now.getUTCFullYear() + '-' + 
                     String(now.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                     String(now.getUTCDate()).padStart(2, '0');
  const kstHour = now.getUTCHours();

  // 2. 환경 변수 정리 (공백 및 따옴표 제거)
  const startDay = process.env.MONITOR_START_DATE?.trim().replace(/['"]/g, '');
  const endDay = process.env.MONITOR_END_DATE?.trim().replace(/['"]/g, '');
  const startHour = parseInt(process.env.MONITOR_START_HOUR || '10', 10);
  const endHour = parseInt(process.env.MONITOR_END_HOUR || '17', 10);

  // 3. 판단 로그 (GitHub Actions 로그에서 확인 가능)
  console.log(`[Schedule Check] 현재 KST: ${kstDateStr} ${kstHour}시`);
  console.log(`[Schedule Check] 설정 범위: ${startDay || '미설정'} ~ ${endDay || '미설정'}, ${startHour} ~ ${endHour}시`);

  // 4. 날짜 체크 (문자열 직접 비교로 타임존 오차 차단)
  if (startDay && kstDateStr < startDay) {
    console.log(`[Schedule Check] Skip: 시작일(${startDay}) 이전입니다.`);
    return false;
  }
  if (endDay && kstDateStr > endDay) {
    console.log(`[Schedule Check] Skip: 종료일(${endDay}) 이후입니다.`);
    return false;
  }

  // 5. 시간 체크
  if (kstHour < startHour || kstHour >= endHour) {
    console.log(`[Schedule Check] Skip: 허용 시간(${startHour} ~ ${endHour}시) 밖입니다.`);
    return false;
  }

  console.log(`[Schedule Check] Pass: 스케줄 이내입니다. 테스트를 실행합니다.`);
  return true;
}

/**
 * 한국 시간(KST)을 계산하기 위해 UTC+9시간이 더해진 Date 객체를 반환합니다.
 * 이 객체는 반드시 getUTC... 메서드로 읽어야 합니다.
 */
function getKSTDate() {
  const now = new Date();
  // UTC 기준 밀리초에 무조건 9시간을 더함
  return new Date(now.getTime() + (9 * 60 * 60 * 1000));
}