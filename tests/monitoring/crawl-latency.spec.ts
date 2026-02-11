import { test, expect } from '@playwright/test';
import { calculateTimeDiff } from '../../utils/time';
import { isWithinSchedule } from '../../utils/schedule';
import { sendDiscordAlert, AlertItem } from '../../utils/discord';

test.describe('@monitoring Data Freshness Check', () => {
  // Default threshold: 1 hour (can be overridden by env var)
  const MAX_DELAY_MS = process.env.MAX_DELAY_MS 
    ? parseInt(process.env.MAX_DELAY_MS, 10) 
    : 60 * 60 * 1000;

  test.beforeEach(async ({ page }) => {
    // Skip test if outside of schedule
    if (!isWithinSchedule()) {
      test.skip(true, 'Outside of monitoring schedule');
    }
  });

  test('should have up-to-date crawling data', async ({ page }) => {
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
          message: 'No data rows found on the page. Possible system failure or empty state.',
        });
        throw new Error('No data rows found');
      }

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
            message: 'Missing data-crawled-at attribute',
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
              message: `Data is stale. Delay: ${Math.floor(diff / 1000 / 60)} min`,
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
          message: 'ALL data rows are stale. SSE connection or Crawler might be down.',
        });
      }

    } catch (error) {
      console.error('Test execution failed:', error);
      alerts.push({
        severity: 'CRITICAL',
        message: `Test execution failed: ${(error as Error).message}`,
      });
    } finally {
      // 3. Send Alerts if any
      if (alerts.length > 0) {
        await sendDiscordAlert(alerts);
        
        // Fail the test if there are any alerts
        // This ensures the CI job status reflects the monitoring status
        expect(alerts.length, 'Monitoring alerts detected').toBe(0);
      }
    }
  });
});
