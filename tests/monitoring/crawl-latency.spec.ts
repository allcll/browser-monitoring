import { test, expect } from '@playwright/test';
import { calculateTimeDiff } from '../../utils/time';
import { isWithinSchedule } from '../../utils/schedule';
import { sendDiscordAlert, AlertItem } from '../../utils/discord';

test.describe('@monitoring Data Freshness Check', () => {
  // Default threshold: 1 hour (can be overridden by env var)
  const MAX_DELAY_MS = process.env.MAX_DELAY_MS 
    ? parseInt(process.env.MAX_DELAY_MS, 10) 
    : 60 * 60 * 1000;

  test.beforeEach(async () => {
    // Skip test if outside of schedule
    if (!isWithinSchedule()) {
      test.skip(true, 'Outside of monitoring schedule');
    }
  });

  test('should have up-to-date crawling data', async ({ page }, testInfo) => {
    const alerts: AlertItem[] = [];

    try {
      // 1. Navigate to the target page
      await page.goto('/live');
      
      // Wait for the table to load (adjust selector as needed)
      // Assuming there's a table or list with data-testid="crawl-row"
      // If the page uses SSE/WebSocket, we might need to wait a bit for data to populate
      try {
        await page.waitForSelector('[data-testid="crawl-row"]', { timeout: 10000 });
      } catch (e) {
        // If no rows found, it might be a critical failure (empty list)
        alerts.push({
          severity: 'CRITICAL',
          message: '전광판 페이지에서 데이터 행이 발견되지 않았습니다. 시스템 장애 또는 빈 상태일 수 있습니다.',
        });
        throw new Error('데이터 행이 없습니다');
      }
      await page.waitForTimeout(3000);

      const rows = page.getByTestId('crawl-row');
      const count = await rows.count();
      
      console.log(`Found ${count} rows to check.`);

      let staleCount = 0;
      let validCount = 0;

      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        const crawledAtStr = await row.getAttribute('data-crawled-at');
        const rowId = await row.getAttribute('data-row-id') || `index-${i}`;

        if (!crawledAtStr) {
          alerts.push({
            severity: 'WARNING',
            message: '전광판 페이지에서 data-crawled-at 속성을 가진 행이 누락되었습니다.',
            rowId,
          });
          continue;
        }

        const crawledAt = parseInt(crawledAtStr, 10);
        const diff = calculateTimeDiff(crawledAt);
        
        // Check if data is stale
        if (diff > MAX_DELAY_MS) {
          staleCount++;
          // Add to alerts (limit to first 5 to avoid spamming)
          if (staleCount <= 5) {
            alerts.push({
              severity: 'WARNING',
              message: `전광판의 데이터가 오래되었습니다. 지연 시간:  ${Math.floor(diff / 1000 / 60)} 분`,
              rowId,
              timestamp: crawledAt,
            });
          }
        } else {
          validCount++;
        }
      }

      // 2. Indirect SSE Verification
      // If all data is stale, it might indicate SSE or Backend failure
      if (count > 0 && validCount === 0) {
        alerts.push({
          severity: 'CRITICAL',
          message: '전광판의 모든 행의 데이터가 오래되었습니다. SSE 연결 또는 크롤러가 다운되었을 수 있습니다.',
        });
      }

    } catch (error) {
      console.error('Test execution failed:', error);
      alerts.push({
        severity: 'CRITICAL',
        message: `테스트 실행 실패: ${(error as Error).message}`,
      });
    } finally {
      // 3. Send Alerts if any
      if (alerts.length > 0) {
        const maxRetries = testInfo.project.retries ?? 0;
        const isFinalAttempt = testInfo.retry === maxRetries;

        // Send only once after all retries are exhausted.
        if (isFinalAttempt) {
          await sendDiscordAlert(alerts);
        }
        
        // Fail the test if there are any alerts
        // This ensures the CI job status reflects the monitoring status
        expect(alerts.length, 'Monitoring alerts detected').toBe(0);
      }
    }
  });
});
