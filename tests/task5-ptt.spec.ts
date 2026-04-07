import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe('Task 5: PTT & Mute', () => {
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

  test('PTT and Mute functionality', async ({ browser }) => {
    const ctxA = await browser.newContext({ permissions: ['microphone'] });
    const pageA = await ctxA.newPage();
    await joinRoom(pageA, 'User-A');

    const ctxB = await browser.newContext({ permissions: ['microphone'] });
    const pageB = await ctxB.newPage();
    await joinRoom(pageB, 'User-B');

    console.log('Testing PTT mode...');
    const pttToggle = pageA.locator('.ptt-toggle');
    await expect(pttToggle).toBeEnabled({ timeout: 10000 });
    await pttToggle.click();
    
    const myCard = pageA.locator('.participant-card').filter({ hasText: 'User-A' });
    await expect(myCard.locator('.indicator.muted')).toBeVisible();
    
    console.log('Pressing Space...');
    await pageA.keyboard.down('Space');
    await expect(myCard.locator('.indicator.muted')).not.toBeVisible();
    
    await pageA.keyboard.up('Space');
    await expect(myCard.locator('.indicator.muted')).toBeVisible();

    console.log('Testing PTT suppression in Chat...');
    const chatInput = pageA.locator('input[name="message"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    await chatInput.focus();
    await pageA.keyboard.down('Space');
    
    // Should STILL be muted
    await expect(myCard.locator('.indicator.muted')).toBeVisible();
    console.log('PTT suppressed in chat input.');

    await ctxA.close();
    await ctxB.close();
  });
});
