import { test, expect, Page } from '@playwright/test';

test.describe('Task 7: Audio Reliability & WebRTC Mesh Stability', () => {
  const roomId = `general`;
  const roomUrl = `http://localhost:4200/room/${roomId}`;
  const roomPassword = '123';

  async function joinRoom(page: Page, name: string) {
    await page.goto(roomUrl);
    await page.waitForSelector('input[placeholder="Display Name"]', { timeout: 10000 });
    await page.fill('input[placeholder="Display Name"]', name);
    await page.fill('input[placeholder="Room Password"]', roomPassword);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.participant-card', { timeout: 15000 });
  }

  test('User A should maintain/recover connections when User B rejoins multiple times', async ({ browser }) => {
    const ctxA = await browser.newContext({ permissions: ['microphone'] });
    const pageA = await ctxA.newPage();
    await joinRoom(pageA, 'User-A');

    for (let i = 0; i < 3; i++) {
      console.log(`Iteration ${i + 1}: User-B joining`);
      const ctxB = await browser.newContext({ permissions: ['microphone'] });
      const pageB = await ctxB.newPage();
      await joinRoom(pageB, `User-B-${i}`);

      // Wait for both to see each other
      await expect(pageA.locator('.participant-card')).toHaveCount(2, { timeout: 10000 });
      await expect(pageB.locator('.participant-card')).toHaveCount(2, { timeout: 10000 });

      // Check if WebRTC connection is established (we can check for the presence of remote audio element in DOM)
      // The WebRtcService adds <audio> elements to document.body
      const audioElementsA = pageA.locator('audio');
      await expect(audioElementsA).toHaveCount(1, { timeout: 10000 }); // User B's audio

      const audioElementsB = pageB.locator('audio');
      await expect(audioElementsB).toHaveCount(1, { timeout: 10000 }); // User A's audio

      console.log(`Iteration ${i + 1}: User-B leaving`);
      await pageB.close();
      await ctxB.close();

      // User A should now have 0 remote audio elements and 1 participant card
      await expect(pageA.locator('.participant-card')).toHaveCount(1, { timeout: 10000 });
      await expect(pageA.locator('audio')).toHaveCount(0, { timeout: 10000 });
    }
  });
});
