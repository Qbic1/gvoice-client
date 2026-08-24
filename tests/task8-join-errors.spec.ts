import { test, expect, Page } from '@playwright/test';
import { ensureApiUp } from './backend';

/**
 * The join form owns the subscriptions to invalidPassword$ / roomNotFound$ /
 * roomFull$, and the server can only answer once the connection is up — i.e.
 * while the status is already 'Connecting'. Unmounting the form in that state
 * silently swallows every rejection and leaves the user on a spinner forever,
 * so these specs pin the form to the whole pre-room phase.
 */
test.describe('Task 8: Join rejections are reported', () => {
  test.beforeEach(ensureApiUp);

  async function attemptJoin(page: Page, roomId: string, name: string, password: string) {
    await page.goto(`http://localhost:4200/room/${roomId}`);
    await page.waitForSelector('input[placeholder="Display Name"]', { timeout: 10000 });
    await page.fill('input[placeholder="Display Name"]', name);
    await page.fill('input[placeholder="Room Password"]', password);
    await page.click('button[type="submit"]');
  }

  test('Wrong password should show an error instead of hanging', async ({ page }) => {
    await attemptJoin(page, 'general', 'WrongPass-User', 'definitely-wrong');

    await expect(page.locator('.field-error')).toContainText('Incorrect room password', { timeout: 15000 });
    // The form must come back, not stay disabled behind a spinner.
    await expect(page.locator('button[type="submit"]')).toHaveText('Join');
  });

  test('Unknown room should show an error instead of hanging', async ({ page }) => {
    await attemptJoin(page, 'no-such-room-here', 'Ghost-User', '123');

    await expect(page.locator('.field-error')).toContainText('does not exist', { timeout: 15000 });
    await expect(page.locator('button[type="submit"]')).toHaveText('Join');
  });
});
