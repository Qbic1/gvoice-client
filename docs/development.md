# Development

How to run, build and test the GVoice client locally.

- Related: [configuration.md](./configuration.md) · [testing.md](./testing.md) ·
  [architecture.md](./architecture.md)

---

## 1. Prerequisites

| Requirement | Version | Why |
|---|---|---|
| **Node.js** | **≥ 22.12** (LTS) | **Hard requirement.** The Angular 21 CLI/build **and** Vitest 4 both refuse to run on older Node. Vitest's jsdom-based unit tests will not start below this. |
| npm | 11.x (`packageManager: npm@11.9.0`) | Lockfile is npm; use `npm ci`. |
| Backend `gvoice-server` | running on **`http://localhost:5293`** | `ng serve` proxies nothing — the client calls the backend directly in dev. Without it, join/lobby fail. |
| Chromium (Playwright) | installed via `npx playwright install` | For e2e only. |

> If `ng serve`, `ng test`, or `npx vitest` fail immediately with an engine/version
> error, check `node -v` **first** — a too-old Node is the usual cause.

---

## 2. Install

```bash
node -v            # verify >= 22.12
npm ci             # clean, lockfile-exact install
```

---

## 3. Run the dev server

```bash
ng serve           # http://localhost:4200
```

The dev server needs the **backend on `:5293`** (SignalR hub + REST). Start
`gvoice-server` first:

```bash
# in ../gvoice-server
dotnet run --project GVoice.API      # → http://localhost:5293
```

Then open `http://localhost:4200`, land on the lobby, and join a room (default
rooms `General` / `Gaming` / `Music` are recreated on backend startup; room
password for the seeded rooms in the e2e specs is `123`).

Notes:
- `getUserMedia` needs a secure context; `http://localhost` counts as secure, so
  the mic works in dev without HTTPS.
- The build's `defaultConfiguration` is `production`; `ng serve` uses the
  `development` configuration (source maps, no optimization).

---

## 4. Build

```bash
ng build                              # production build (default configuration)
```

Output goes to `dist/gvoice-client/`:

```
dist/gvoice-client/
├── browser/      ← the static client bundle  (this is what gets deployed)
└── server/       ← SSR server (server.mjs)   (built, NOT used in prod)
```

`angular.json` sets `"outputMode": "static"` with an `ssr.entry`, so both are
emitted. Only `browser/` is served in production (see [deployment.md](./deployment.md)).

Other build commands:

```bash
npm run watch                                    # ng build --watch --configuration development
npm run serve:ssr:gvoice-client                  # node dist/gvoice-client/server/server.mjs (rarely needed)
```

---

## 5. AudioWorklets — where they live

The two `AudioWorklet` files are **plain static assets**, not bundled TS:

```
public/audio-worklet.js   → registerProcessor('noise-gate-processor')
public/vad-worklet.js      → registerProcessor('vad-processor')
```

They are copied verbatim by `angular.json` `assets` (`{ glob: '**/*', input: 'public' }`)
and loaded at runtime from **absolute** paths:

```ts
await ctx.audioWorklet.addModule('/audio-worklet.js');
await ctx.audioWorklet.addModule('/vad-worklet.js');
```

Absolute paths matter: on a routed page like `/room/123`, a relative path would
resolve wrong. If you edit a worklet, hard-reload — the browser caches worklet
modules aggressively.

---

## 6. Environment-file gotcha (read before editing config)

All services import environment values from **`environments/environment.development`
directly** — not from a barrel. The production build swaps that file out via
`fileReplacements` in `angular.json`:

```jsonc
// angular.json → production configuration
"fileReplacements": [
  { "replace": "src/environments/environment.development.ts",
    "with":    "src/environments/environment.ts" }
]
```

Therefore:

- `environment.development.ts` = **dev** values (`rootUrl: http://localhost:5293`,
  your local TURN credential).
- `environment.ts` = **prod** values (`rootUrl: /api`), used only in production builds.

**When you change the *shape* of the config (add/rename a field), edit BOTH files**
or the production build breaks (or worse, silently ships stale values). Full
details in [configuration.md](./configuration.md).

---

## 7. Unit tests (Vitest)

Runner: Angular's `@angular/build:unit-test` builder backed by **Vitest**, jsdom
environment. Requires **Node ≥ 22.12** (jsdom won't init otherwise).

```bash
ng test                                                        # all *.spec.ts under src/, headless
npx vitest run src/app/core/services/participant.service.spec.ts   # a single file
npx vitest                                                     # watch mode
```

Current specs: `participant.service.spec.ts`, `settings.service.spec.ts`,
`theme.service.spec.ts`, `linkify.pipe.spec.ts`, `app.spec.ts`. See
[testing.md](./testing.md) for coverage and gaps.

---

## 8. End-to-end tests (Playwright)

These are **integration** tests, not unit tests: they need **both** the dev
server (`:4200`) **and** the backend (`:5293`) running.

```bash
# terminal 1: backend
cd ../gvoice-server && dotnet run --project GVoice.API
# terminal 2: client
ng serve
# terminal 3: e2e
npx playwright test                                   # all specs in tests/
npx playwright test tests/task4-reconnect.spec.ts     # one spec
npx playwright test -g "Should reconnect"             # by title
```

Config highlights (`playwright.config.ts`):

- **`workers: 1` / `fullyParallel: false`** — on purpose. The backend keeps room
  state **in memory**, so parallel specs would race over shared rooms.
- Chromium launches with **fake-media flags** so `getUserMedia` returns a
  synthetic mic without a device or permission prompt:
  `--use-fake-ui-for-media-stream`, `--use-fake-device-for-media-stream`,
  `--mute-audio`.
- `baseURL: http://localhost:4200`.
- `ng e2e` is **not** wired up — always call `npx playwright test` directly.

> `tests/task4.1-restart.spec.ts` kills the backend with a Windows-specific
> `taskkill /IM GVoice.API.exe`; adapt it if you run the backend differently.
