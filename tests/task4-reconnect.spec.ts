import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe('Task 4: Reconnection Logic', () => {
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

  test('Should reconnect and stay in room', async ({ page }) => {
    await joinRoom(page, 'Reconnect-User');
    console.log('Joined room. Simulating disconnect...');

    // We can simulate disconnect by going offline in CDP
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
        offline: true,
        latency: 0,
        downloadThroughput: 0,
        uploadThroughput: 0,
    });
    
    console.log('Went offline. Waiting for app to notice (visual feedback expected)...');
    // The PRD says status indicator should show reconnection attempt.
    // In our current code (App.ts), it shows .disconnect-overlay if connectionStatus === 'Error'
    
    // Wait a bit
    await page.waitForTimeout(5000);

    console.log('Going back online...');
    await client.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
    });

    console.log('Waiting for auto-reconnect...');
    // If auto-reconnect works, the overlay should disappear and we should still be in the room.
    // BUT BUG-F01 suggests we might be "Connected" but not in the room group anymore.
    
    // If we are in the room, we should see our own card.
    await expect(page.locator('.participant-card')).toBeVisible({ timeout: 30000 });
    console.log('Successfully reconnected and still see participant cards.');
  });
});
