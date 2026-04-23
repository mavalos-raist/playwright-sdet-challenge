# DemoQA Book Store — Playwright SDET Framework

Production-quality Playwright testing framework for the [DemoQA BookStore](https://demoqa.com/books). Covers authentication, book catalog, collection management, user profile, and full end-to-end journeys through both API and UI layers.

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18 (tested on v25) |
| OS | Windows, macOS, or Linux |
| Network | Live internet access — suite runs against the live DemoQA application |

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/mavalos-raist/playwright-sdet-challenges
cd playwright-sdet-challenge

# 2. Install dependencies
npm ci

# 3. Install Playwright browsers
npx playwright install chromium
```

## Environment Setup

Copy `.env.example` to `.env` and fill in your DemoQA credentials:

```bash
cp .env.example .env
```

```env
BASE_URL=https://demoqa.com
API_BASE_URL=https://demoqa.com
TEST_USERNAME=<your DemoQA username>
TEST_PASSWORD=<your DemoQA password>
```

`TEST_USERNAME` / `TEST_PASSWORD` are only needed for the `setup` project — it logs in the bootstrap user once and saves the session to `storageState/user.json`. Individual tests create and delete their own ephemeral users via API.

## Running Tests

```bash
# Run the full suite (setup + chromium)
npm test

# Interactive UI mode — debug tests visually
npm run test:ui

# Run with visible browser
npm run test:headed

# Run a single spec file
npx playwright test tests/ui/collection.spec.ts

# Run a single test by annotation ID
npx playwright test --grep "COLL-001"

# Run only the setup project
npx playwright test --project=setup

# View HTML report after a run
npm run report

# Lint
npm run lint

# Format
npm run format
```

## Test Suite

| ID | File | Test Name | Style |
|---|---|---|---|
| AUTH-001 | auth.spec.ts | Authentication › Login › Reject invalid credentials | UI |
| AUTH-002 | auth.spec.ts | Authentication › Register › Create unique user successfully | API + UI |
| BOOK-001 | books.spec.ts | Books › Catalog › List all books and verify dataset | API |
| BOOK-002 | books.spec.ts | Books › Catalog › Search and open detail view | UI + API |
| COLL-001 | collection.spec.ts | Books › Collection › Add book and verify in profile | UI + API |
| COLL-002 | collection.spec.ts | Books › Collection › Remove book and verify it is gone | UI + API |
| COLL-003 | collection.spec.ts | Books › Collection › Clear collection and verify empty state | UI + API |
| COLL-004 | collection.spec.ts | Books › Collection › Reject duplicate book add | API (negative) |
| PROF-001 | profile.spec.ts | Profile › User data › Show correct username after login | UI + API |
| E2E-001 | e2e.spec.ts | End to End › User journey › Register add verify remove verify gone | UI + API |

Every test that creates data:
- uses unique Faker-generated credentials per run (parallel-safe)
- runs cleanup in a `finally` block (guaranteed even on assertion failure)
- carries a unique annotation ID

## Architecture

### Two-Project Flow

`playwright.config.ts` defines two Playwright projects:

1. **setup** — matches `*.setup.ts`, runs `tests/setup/auth.setup.ts`, logs in the bootstrap user and saves `storageState/user.json`.
2. **chromium** — depends on `setup`, loads `storageState/user.json` so every test starts already authenticated.

Tests that need their own isolated user (most tests in this suite) override the inherited session:

```ts
test.use({ storageState: { cookies: [], origins: [] } })
```

### Custom Page — Proxy over BasePage + Page

`src/pages/createCustomPage.ts` returns a `Proxy` merging two objects:

- **`BasePage`** — adds auth-state methods: `getAPI()`, `getUserId()`, `getAuthInfo()`, `syncAuthState()`, `getUserData()`.
- **Playwright `Page`** — all native Playwright methods fall through transparently.

```ts
// Both work on the same customPage fixture:
await page.goto('/profile')              // Playwright Page method
const auth = await page.getAuthInfo()    // BasePage method
```

### DemoQA Auth Behaviour

DemoQA stores the JWT as **browser cookies** after UI login (`token`, `userID`, `userName`, `expires`) — not in localStorage. `BasePage.getAuthInfo()` reads from localStorage first, then falls back to cookies. `BasePage.syncAuthState()` mirrors the auth state into localStorage in the format DemoQA's React app expects, which is required for full-page reloads of `/profile` to render correctly.

### Login Helper

`src/utils/loginHelper.ts` exports `loginAndSync(page, user)`:

1. Navigates to `/login` and fills credentials
2. Waits for redirect to `/profile`
3. Reads auth state from cookies via `page.getAuthInfo()`
4. Syncs it into localStorage via `page.syncAuthState()`
5. Returns the normalized `AuthState`

```ts
const authInfo = await loginAndSync(page, user)
// authInfo: { token, userId, userName, password, expires, isLoggedIn }
```

Every test that needs an authenticated browser session uses this helper.

### `apiContext` Fixture

A `BaseAPI` instance pre-configured with `API_BASE_URL` and JSON headers. For negative tests that need to inspect a non-2xx response, use `apiContext.context.post(...)` to bypass the auto-assert:

```ts
// Raw request — response not auto-asserted
const response = await apiContext.context.post(url, { headers, data })
expect(response.status()).toBe(400)
```

### BaseAPI (`src/api/baseApi.ts`)

Thin wrapper with generic `get<T>`, `post<T>`, `delete<T>` methods that auto-assert `response.ok()` and parse JSON (returning `{}` on 204). The `.context` getter exposes the underlying `APIRequestContext` for raw access.

### Function Modules (`src/functions/`)

| File | Functions |
|---|---|
| `auth.ts` | `registerUser`, `generateToken`, `getUserProfile`, `deleteUser` |
| `books.ts` | `listBooks`, `getBook`, `addToCollection`, `removeFromCollection`, `clearCollection` |
| `shared.ts` | `resolveApiClient`, `buildJsonHeaders`, `getApiBaseUrl` |
| `testData.ts` | `uniqueUsername`, `uniquePassword`, `generateUserData`, `buildAddBookPayload` |

All helpers accept `BaseAPI | BasePage | APIRequestContext` via function overloads — no bare `any` in signatures.

### Cleanup

`src/utils/cleanup.ts` exports `cleanupUserData(apiContext, userId, token)` — clears the collection then deletes the user. Called in `finally` in every test that creates an ephemeral user.

## Project Structure

```text
src/
  api/        baseApi.ts
  fixtures/   test.ts
  functions/  auth.ts · books.ts · shared.ts · testData.ts
  pages/      basePage.ts · createCustomPage.ts
  types/      api.ts · books.ts · user.ts
  utils/      cleanup.ts · env.ts · loginHelper.ts

tests/
  setup/      auth.setup.ts
  ui/         auth.spec.ts · books.spec.ts · collection.spec.ts
              e2e.spec.ts · profile.spec.ts
```

## Coding Standards

- TypeScript strict mode with `@/*` path aliases
- ESLint: `@typescript-eslint/no-explicit-any: 'error'` — no `any` in helper signatures
- Prettier: no semicolons, single quotes, no trailing commas, 100-char line width
- Test naming: `Domain > Feature > Action`
- Annotation IDs on every test: `{ type: 'ID', description: 'COLL-001' }`
- Parallel-safe: unique credentials per run via Faker.js, no shared mutable state
- Cleanup guarantee: `finally` block in every test that creates data

## Submission Checklist

- [ ] Full suite passes
- [ ] Full suite run repeated 3+ times to confirm stability
- [ ] No credentials committed (only `.env.example`)
- [ ] Public repository ready
- [ ] Clean commit history
