import { test, expect, BrowserContext, Page } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

  test('Should show disconnect banner and allow manual rejoin after server restart', async ({ page }) => {
    test.setTimeout(60000);
    await joinRoom(page, 'Restart-User');
    console.log('Joined room. Killing backend...');

    // Kill backend
    try {
        await execAsync('cmd /c "taskkill /F /IM GVoice.API.exe"');
    } catch (e) {
        console.warn('Failed to kill backend (maybe already dead?):', e.message);
    }

    console.log('Backend killed. Waiting for app to show Error status...');
    // SignalR will try to reconnect, but it might take a while to hit 'Error' if retries are active.
    // In SignalRService.ts: .withAutomaticReconnect().build()
    
    // According to App.ts, disconnect-overlay shows when connectionStatus() === 'Error'
    await expect(page.locator('.disconnect-overlay')).toBeVisible({ timeout: 30000 });
    console.log('Disconnect overlay visible.');

    // Restart backend
    console.log('Restarting backend...');
    exec('dotnet run --project ../gvoice-server/GVoice.API', { cwd: process.cwd() });
    
    // Wait for backend port
    await page.waitForTimeout(5000);

    // Click rejoin
    console.log('Clicking rejoin...');
    await page.click('.disconnect-overlay button');

    // Should be back in the lobby or join screen (rejoin() navigates to '/')
    await expect(page).toHaveURL('http://localhost:4200/');
    console.log('Navigated back to lobby.');
  });
});
