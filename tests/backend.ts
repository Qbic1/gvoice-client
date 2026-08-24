import { execSync, spawn } from 'child_process';
import * as path from 'path';

/**
 * Helpers for the specs that take the backend down on purpose.
 *
 * They drive the *built* exe rather than `dotnet run`, because `dotnet run`
 * rebuilds first and can take longer than SignalR's reconnect window
 * (withAutomaticReconnect retries at 0/2/10/30s, then gives up for good).
 */
export const API_EXE = path.resolve(
  __dirname,
  '../../gvoice-server/GVoice.API/bin/Debug/net10.0/GVoice.API.exe'
);

export function killApi() {
  try {
    execSync('taskkill /F /IM GVoice.API.exe', { stdio: 'ignore' });
  } catch {
    // already down
  }
}

export function startApi() {
  // cwd must be the exe's own directory — that is the content root it resolves
  // appsettings.json (DefaultRooms, CORS origins) against.
  spawn(API_EXE, ['--urls', 'http://localhost:5293'], {
    cwd: path.dirname(API_EXE),
    detached: true,
    stdio: 'ignore',
  }).unref();
}

export async function waitForApi(timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch('http://localhost:5293/rooms');
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('Backend did not come back up in time');
}

/**
 * Any spec that kills the backend must call this before and after, otherwise it
 * leaves every later spec in the (serial) suite unable to join a room.
 */
export async function ensureApiUp() {
  try {
    await waitForApi(2000);
  } catch {
    startApi();
    await waitForApi();
  }
}

/**
 * The backend keeps room state in memory and a participant only disappears once
 * its SignalR disconnect lands, which trails the browser context closing. Specs
 * that assert on exact participant counts must wait for the previous spec's
 * users to actually drain, or they race with it.
 */
export async function waitForEmptyRoom(roomId: string, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const rooms: { id: string; participantCount: number }[] = await (
      await fetch('http://localhost:5293/rooms')
    ).json();
    if ((rooms.find(r => r.id === roomId)?.participantCount ?? 0) === 0) return;
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Room "${roomId}" did not drain in time`);
}
