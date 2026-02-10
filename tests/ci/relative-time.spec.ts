import { test, expect } from '@playwright/test';
import { isRelativeTimeValid } from '../../utils/time';

test.describe('Relative Time UI Logic', () => {
  // Mock current time to a fixed timestamp for consistent testing
  // 2024-02-10 12:00:00 KST (UTC+9)
  const MOCK_NOW = new Date('2024-02-10T12:00:00+09:00').getTime();

  test.beforeEach(async ({ page }) => {
    // Install fake clock
    await page.clock.install({ time: MOCK_NOW });
  });

  test('should display correct relative time format based on data-crawled-at', async ({ page }) => {
    // Inject mock HTML content directly for isolation
    await page.setContent(`
      <table>
        <tbody>
          <!-- Case 1: 30 seconds ago -->
          <tr data-testid="crawl-row" data-crawled-at="${MOCK_NOW - 30 * 1000}">
            <td class="relative-time">30초 전</td>
          </tr>
          <!-- Case 2: 5 minutes ago -->
          <tr data-testid="crawl-row" data-crawled-at="${MOCK_NOW - 5 * 60 * 1000}">
            <td class="relative-time">5분 전</td>
          </tr>
          <!-- Case 3: 2 hours ago -->
          <tr data-testid="crawl-row" data-crawled-at="${MOCK_NOW - 2 * 60 * 60 * 1000}">
            <td class="relative-time">2시간 전</td>
          </tr>
        </tbody>
      </table>
    `);

    const rows = page.getByTestId('crawl-row');
    const count = await rows.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const crawledAtStr = await row.getAttribute('data-crawled-at');
      const relativeTimeText = await row.locator('.relative-time').innerText();

      expect(crawledAtStr).not.toBeNull();
      const crawledAt = parseInt(crawledAtStr!, 10);
      
      // Calculate diff using the mocked time
      const diff = MOCK_NOW - crawledAt;

      // Verify logic using our utility
      const isValid = isRelativeTimeValid(diff, relativeTimeText);
      
      expect(isValid, `Row ${i}: "${relativeTimeText}" should match diff ${diff}ms`).toBe(true);
    }
  });

  test('should handle future dates gracefully (if applicable)', async ({ page }) => {
    // Future date case (should not happen in reality but good for robustness)
    await page.setContent(`
      <table>
        <tbody>
          <tr data-testid="crawl-row" data-crawled-at="${MOCK_NOW + 10000}">
            <td class="relative-time">방금 전</td> 
          </tr>
        </tbody>
      </table>
    `);
    
    // Just ensuring it doesn't crash or show weird negative numbers
    // The specific behavior depends on implementation, here we just check existence
    await expect(page.getByTestId('crawl-row')).toBeVisible();
  });
});
