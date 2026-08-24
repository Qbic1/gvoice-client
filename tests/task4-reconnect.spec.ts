import { test, expect, Page } from '@playwright/test';
import { ensureApiUp, killApi, startApi, waitForApi } from './backend';

/**
 * These specs drop the connection by killing Kestrel, not with CDP offline
 * emulation: `Network.emulateNetworkConditions` does not close an already-open
 * WebSocket, so SignalR would only notice after `serverTimeoutInMilliseconds`
 * (120s) — which is not the case being tested. Killing the server closes the
 * socket and fires `onreconnecting` immediately.
 */

test.describe('Task 4: Reconnection Logic', () => {
  const targetUrl = 'http://localhost:4200/room/general';
  const roomPassword = '123';

  async function joinRoom(page: Page, name: string) {
    await page.goto(targetUrl);
    await page.waitForSelector('input[placeholder="Display Name"]', { timeout: 10000 });
    await page.fill('input[placeholder="Display Name"]', name);
    await page.fill('input[placeholder="Room Password"]', roomPassword);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.participant-card', { timeout: 15000 });
  }

  // These tests kill the backend on purpose, so neither the next test nor the
  // rest of the suite can assume it is still up.
  test.beforeEach(ensureApiUp);
  test.afterAll(ensureApiUp);

  test('Should keep the room mounted while reconnecting, then recover', async ({ page }) => {
    test.setTimeout(120000);

    await joinRoom(page, 'Reconnect-User');

    // Mute first: the server re-registers a rejoining peer with default state,
    // so the client has to re-broadcast or peers end up seeing an open mic.
    await page.locator('.control-btn').first().click();
    await expect(page.locator('.participant-card .indicator.muted')).toBeVisible();

    killApi();

    // The room must survive the blip. Tearing it down would drop the in-memory
    // chat and put the user back on the password form.
    await expect(page.locator('.reconnect-banner')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.participant-card').first()).toBeVisible();
    await expect(page.locator('input[placeholder="Display Name"]')).toHaveCount(0);

    // Sending is a no-op while the hub is down, so the composer must not accept
    // a message that would silently vanish.
    await expect(page.locator('.chat-input-form input')).toBeDisabled();

    startApi();
    await waitForApi();

    await expect(page.locator('.reconnect-banner')).toHaveCount(0, { timeout: 60000 });
    await expect(page.locator('.participant-card').first()).toBeVisible();
    await expect(page.locator('.chat-input-form input')).toBeEnabled();

    // The roster is rebuilt from the server's view — it must still say muted.
    await expect(page.locator('.participant-card .indicator.muted')).toBeVisible({ timeout: 10000 });
  });

  test('Should let the user abandon a reconnect and rejoin afterwards', async ({ page }) => {
    test.setTimeout(120000);

    await joinRoom(page, 'Bail-Out-User');
    killApi();

    await expect(page.locator('.reconnect-banner')).toBeVisible({ timeout: 20000 });

    // Bailing out must not wait for SignalR to exhaust its retries.
    await page.locator('.reconnect-cancel').click();
    await expect(page).toHaveURL('http://localhost:4200/');

    // The deliberate stop still fires onclose. If that were reported as a lost
    // session, the app would sit on the disconnect overlay and the join form —
    // which only renders while 'Disconnected' — could never come back.
    startApi();
    await waitForApi();

    await joinRoom(page, 'Bail-Out-User');
    await expect(page.locator('.disconnect-overlay')).toHaveCount(0);
  });

  test('Should show the disconnect overlay with a reason when retries run out', async ({ page }) => {
    test.setTimeout(120000);

    await joinRoom(page, 'Give-Up-User');
    killApi();

    await expect(page.locator('.reconnect-banner')).toBeVisible({ timeout: 20000 });

    // withAutomaticReconnect() retries at 0/2/10/30s, then closes for good.
    await expect(page.locator('.disconnect-overlay')).toBeVisible({ timeout: 90000 });
    await expect(page.locator('.disconnect-card p')).toContainText('connection to the server was lost');
  });
});
