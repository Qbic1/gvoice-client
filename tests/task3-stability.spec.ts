import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe('Task 3: Secret URL Stability', () => {
  const targetRoomId = 'general';
  const targetUrl = `http://localhost:4200/room/${targetRoomId}`;
  const roomPassword = '123';

  async function joinRoom(page: Page, name: string) {
    console.log(`Navigating ${name} to ${targetUrl}`);
    await page.goto(targetUrl);
    
    await page.waitForSelector('input[placeholder="Display Name"]', { timeout: 10000 });
    
    const error = page.locator('.field-error');
    if (await error.isVisible()) {
        const text = await error.innerText();
        console.error(`Error visible on page before join: ${text}`);
        if (text.includes('does not exist')) {
            await page.screenshot({ path: `stability-error-not-found.png` });
            throw new Error(`Room ${targetRoomId} not found!`);
        }
    }

    await page.fill('input[placeholder="Display Name"]', name);
    await page.fill('input[placeholder="Room Password"]', roomPassword);
    
    console.log(`Submitting join for ${name}`);
    await page.click('button[type="submit"]');
  }

  test('Room ID should be stable and based on room name', async ({ page }) => {
    await joinRoom(page, 'Stability-User');
    
    try {
        await expect(page.locator('.participant-card')).toBeVisible({ timeout: 10000 });
        console.log('Joined stable room "general" successfully.');
    } catch (e) {
        await page.screenshot({ path: `stability-failure.png` });
        const error = page.locator('.field-error');
        if (await error.isVisible()) {
            console.error(`Error visible on page after join attempt: ${await error.innerText()}`);
        }
        throw e;
    }
  });
});
