import { test, expect, Page } from '@playwright/test';
import { ensureApiUp, killApi, startApi, waitForApi } from './backend';

test.describe('Task 4.1: Server Restart Recovery', () => {
  const targetRoomId = 'general';
  const targetUrl = `http://localhost:4200/room/${targetRoomId}`;
  const roomPassword = '123';

  async function joinRoom(page: Page, name: string) {
    await page.goto(targetUrl);
    await page.waitForSelector('input[placeholder="Display Name"]', { timeout: 10000 });
    await page.fill('input[placeholder="Display Name"]', name);
    await page.fill('input[placeholder="Room Password"]', roomPassword);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.participant-card', { timeout: 15000 });
  }

  // This spec kills the backend on purpose; without restoring it, every later
  // spec in the (serial) suite fails to join a room.
  test.beforeEach(ensureApiUp);
  test.afterAll(ensureApiUp);

  test('Should show disconnect banner and allow manual rejoin after server restart', async ({ page }) => {
    // withAutomaticReconnect() retries at 0/2/10/30s before closing for good,
    // so the overlay cannot appear in under ~35s.
    test.setTimeout(150000);

    await joinRoom(page, 'Restart-User');

    killApi();

    // While the retries are still running the room stays mounted behind a banner.
    await expect(page.locator('.reconnect-banner')).toBeVisible({ timeout: 20000 });

    // Once they are exhausted the session is over and the overlay explains why.
    await expect(page.locator('.disconnect-overlay')).toBeVisible({ timeout: 90000 });

    startApi();
    await waitForApi();

    await page.click('.disconnect-overlay button');

    // rejoin() tears down the session and navigates back to the lobby.
    await expect(page).toHaveURL('http://localhost:4200/');
  });
});
