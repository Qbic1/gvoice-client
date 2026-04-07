import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe('Task 1: Basic Join & Mesh Lifecycle', () => {
  const roomId = `general`;
  const roomUrl = `http://localhost:4200/room/${roomId}`;
  const roomPassword = '123';

  async function joinRoom(page: Page, name: string) {
    console.log(`Navigating ${name} to ${roomUrl}`);
    await page.goto(roomUrl);
    
    await page.waitForSelector('input[placeholder="Display Name"]', { timeout: 10000 });
    await page.fill('input[placeholder="Display Name"]', name);
    await page.fill('input[placeholder="Room Password"]', roomPassword);
    
    console.log(`Submitting join for ${name}`);
    await page.click('button[type="submit"]');
    
    // Check for errors
    const error = page.locator('.field-error');
    if (await error.isVisible()) {
      console.error(`Join error for ${name}: ${await error.innerText()}`);
    }

    // Wait for the participant list or card to appear
    try {
      await page.waitForSelector('.participant-card', { timeout: 15000 });
      console.log(`${name} joined successfully`);
    } catch (e) {
      console.error(`Timeout waiting for .participant-card for ${name}`);
      await page.screenshot({ path: `failure-${name}.png` });
      throw e;
    }
  }

  test('User A and User B can join and see each other', async ({ browser }) => {
    const ctxA = await browser.newContext({ permissions: ['microphone'] });
    const pageA = await ctxA.newPage();
    await joinRoom(pageA, 'User-A');

    const ctxB = await browser.newContext({ permissions: ['microphone'] });
    const pageB = await ctxB.newPage();
    await joinRoom(pageB, 'User-B');

    const cardsA = pageA.locator('.participant-card');
    await expect(cardsA).toHaveCount(2, { timeout: 10000 });
    
    const cardsB = pageB.locator('.participant-card');
    await expect(cardsB).toHaveCount(2, { timeout: 10000 });

    await pageA.close();
    await expect(cardsB).toHaveCount(1, { timeout: 10000 });
    
    await ctxA.close();
    await ctxB.close();
  });
});
