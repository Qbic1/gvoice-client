import { test, expect, BrowserContext, Page } from '@playwright/test';
import { ensureApiUp, killApi, startApi, waitForApi, waitForEmptyRoom } from './backend';

test.describe('Task 34: Participant Avatars', () => {
  const roomUrl = 'http://localhost:4200/room/general';
  const roomPassword = '123';

  async function joinRoom(page: Page, name: string) {
    await page.goto(roomUrl);
    await page.waitForSelector('input[placeholder="Display Name"]', { timeout: 10000 });
    await page.fill('input[placeholder="Display Name"]', name);
    await page.fill('input[placeholder="Room Password"]', roomPassword);
    await page.click('button[type="submit"]');
    // Wait for *our own* card, not for a count: a second joiner already sees the
    // people who were there first.
    await expect(page.locator('.participant-card').filter({ hasText: name }))
      .toBeVisible({ timeout: 15000 });
  }

  /** The card whose avatar is the given participant's, from any client's view. */
  function cardFor(page: Page, name: string) {
    return page.locator('.participant-card').filter({ hasText: name });
  }

  /**
   * The avatar a card is showing, read off the label under the display name.
   * Deliberately the visible text rather than an attribute: the portrait itself
   * is aria-hidden inside the card, and this is what the user actually sees.
   */
  function avatarNameOn(page: Page, name: string) {
    return cardFor(page, name).locator('.avatar-name').textContent();
  }

  test.beforeEach(() => waitForEmptyRoom('general'));

  test('Every participant renders a portrait, never an initial', async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: ['microphone'] });
    const page = await ctx.newPage();

    await joinRoom(page, 'Avatar-Solo');

    // The portrait is assigned from the name before anything is chosen, so there
    // is no window in which the card falls back to a letter.
    await expect(cardFor(page, 'Avatar-Solo').locator('svg.avatar-face')).toBeVisible();
    await expect(cardFor(page, 'Avatar-Solo').locator('.avatar-name')).toHaveText(/уебище/);

    await ctx.close();
  });

  test('A pick on one client reaches the other, and only that card', async ({ browser }) => {
    test.setTimeout(90000);
    const contexts: BrowserContext[] = [];

    const ctxA = await browser.newContext({ permissions: ['microphone'] });
    const ctxB = await browser.newContext({ permissions: ['microphone'] });
    contexts.push(ctxA, ctxB);

    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await joinRoom(pageA, 'Avatar-A');
    await joinRoom(pageB, 'Avatar-B');

    await expect(pageA.locator('.participant-card')).toHaveCount(2, { timeout: 15000 });
    await expect(pageB.locator('.participant-card')).toHaveCount(2, { timeout: 15000 });

    const bBefore = await avatarNameOn(pageB, 'Avatar-B');

    // A's own card opens the picker; everyone else's still opens volume.
    await cardFor(pageA, 'Avatar-A').click();
    await expect(pageA.getByRole('dialog')).toBeVisible();

    await pageA.getByRole('button', { name: 'Пьяное уебище' }).click();
    await expect(pageA.getByRole('dialog')).not.toBeVisible();

    await expect
      .poll(() => avatarNameOn(pageA, 'Avatar-A'), { timeout: 10000 })
      .toBe('Пьяное уебище');

    // The point of the feature: the other client sees it without a rejoin.
    await expect
      .poll(() => avatarNameOn(pageB, 'Avatar-A'), { timeout: 10000 })
      .toBe('Пьяное уебище');

    // ...and nobody else was repainted.
    expect(await avatarNameOn(pageB, 'Avatar-B')).toBe(bBefore);

    for (const c of contexts) await c.close();
  });

  test('Another participant\'s card still opens the volume dialog', async ({ browser }) => {
    test.setTimeout(90000);
    const ctxA = await browser.newContext({ permissions: ['microphone'] });
    const ctxB = await browser.newContext({ permissions: ['microphone'] });

    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await joinRoom(pageA, 'Vol-A');
    await joinRoom(pageB, 'Vol-B');
    await expect(pageA.locator('.participant-card')).toHaveCount(2, { timeout: 15000 });

    await cardFor(pageA, 'Vol-B').click();

    // The pre-existing behaviour this feature had to share the click slot with.
    await expect(pageA.getByRole('dialog')).toContainText('User Volume');

    await ctxA.close();
    await ctxB.close();
  });

  test('The chosen avatar survives a reconnect', async ({ browser }) => {
    test.setTimeout(120000);
    await ensureApiUp();

    const ctx = await browser.newContext({ permissions: ['microphone'] });
    const page = await ctx.newPage();

    await joinRoom(page, 'Avatar-Reconnect');

    await cardFor(page, 'Avatar-Reconnect').click();
    await page.getByRole('button', { name: 'Хитрое уебище' }).click();
    await expect
      .poll(() => avatarNameOn(page, 'Avatar-Reconnect'), { timeout: 10000 })
      .toBe('Хитрое уебище');

    // The avatar rides along in Join, and Join is what the client replays after
    // a drop — so this asserts the choice needs no separate re-broadcast.
    killApi();
    startApi();
    await waitForApi();

    await expect
      .poll(() => avatarNameOn(page, 'Avatar-Reconnect'), { timeout: 60000 })
      .toBe('Хитрое уебище');

    await ctx.close();
    await ensureApiUp();
  });
});
