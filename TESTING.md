# Testing Guide — Custom Search Shortcuts

## Overview

The test suite is split into two independent layers:

| Layer | Tool | What is tested | Browser needed |
|---|---|---|---|
| **Unit** | Jest 29 | Pure JS functions in isolation | No |
| **Integration** | Playwright 1.44 | Extension loaded in real Chrome, storage, UI | Yes (headed Chrome) |

```
tests/
├── unit/
│   ├── scoreMatch.test.js           ← omnibox ranking logic
│   ├── substituteEnvVars.test.js    ← environment variable substitution
│   ├── escapeOmni.test.js           ← XML escaping for omnibox descriptions
│   ├── getDomainForOmni.test.js     ← hostname extraction helper
│   ├── eventToShortcutString.test.js ← keyboard shortcut normalisation
│   └── popupHelpers.test.js         ← getInitials, getIconColor, getDomain, resolveUrlWithDefaults
└── integration/
    ├── helpers/
    │   └── extensionHelper.js       ← shared setup: launch Chrome, seed/read storage
    ├── storage.test.js              ← URL CRUD, favorites, categories, settings
    ├── contextMenu.test.js          ← menu rebuild and URL construction in service worker
    ├── usageTracking.test.js        ← recordUsage increments and timestamps
    ├── omnibox.test.js              ← scoreMatch, escapeOmni, getDomainForOmni via service worker
    └── popup.test.js                ← popup UI: empty state, list, filter, query bar, sort pills
```

---

## Prerequisites

### 1. Install Node.js

Node.js **18 or later** is required.

```bash
node --version   # should print v18.x.x or higher
```

### 2. Install dependencies

Run this once from the extension directory:

```bash
cd /path/to/custom_search_shortcuts
npm install
```

### 3. Install Playwright browsers (first time only)

```bash
npx playwright install chromium
```

> Playwright downloads a pinned Chromium build. If you want to use your system Chrome instead, make sure `channel: 'chrome'` is set in `playwright.config.js` (it already is) and Chrome is installed at its default path.

---

## Running the Unit Tests

Unit tests run entirely in Node — no browser, no Chrome APIs needed.

```bash
# Run all unit tests
npm run test:unit

# Run a single test file
npx jest tests/unit/scoreMatch.test.js

# Run in watch mode (re-runs on file save)
npx jest --watch --config jest.config.js

# Run with coverage report
npx jest --coverage --config jest.config.js
```

### Expected output

```
PASS tests/unit/scoreMatch.test.js
PASS tests/unit/substituteEnvVars.test.js
PASS tests/unit/escapeOmni.test.js
PASS tests/unit/getDomainForOmni.test.js
PASS tests/unit/eventToShortcutString.test.js
PASS tests/unit/popupHelpers.test.js

Test Suites: 6 passed, 6 total
Tests:       ~50 passed
```

---

## Running the Integration Tests

Integration tests launch a **real headed Chrome window** with the extension loaded. The window opens and closes automatically.

```bash
# Run all integration tests
npm run test:integration

# Run a single integration test file
npx playwright test tests/integration/storage.test.js --config playwright.config.js

# Run in headed mode with slow-motion (useful for debugging)
npx playwright test --config playwright.config.js --headed --slow-mo=500

# Run in debug mode (pauses at each step)
npx playwright test --config playwright.config.js --debug

# Open the HTML report after a run
npx playwright show-report tests/integration/report
```

### Expected output

```
Running 30 tests using 1 worker

  ✓ Storage — URL CRUD › stores a new URL entry and retrieves it
  ✓ Storage — URL CRUD › stores multiple URLs and preserves order
  ...
  ✓ Popup — sort pills › recent pill can be clicked without error

  30 passed (28s)
```

---

## Running Both Suites Together

```bash
npm test
```

This runs `test:unit` first (fast, no browser), then `test:integration`.

---

## Troubleshooting

### "Cannot find module '../../background.js'"
Make sure you are running Jest from the `custom_search_shortcuts/` directory, or that your `package.json` is in that directory.

### Integration tests fail with "Extension not found" / no service worker
- The tests use Playwright's bundled Chromium (not system Chrome). Run `npx playwright install chromium` if Chromium is not yet installed.
- If `--load-extension` is blocked, ensure `--no-sandbox` and `--disable-setuid-sandbox` are present in the `args` array of both `playwright.config.js` and `tests/integration/helpers/extensionHelper.js`.

### "chrome is not defined" in unit tests
The source files guard all `chrome.*` calls with `if (typeof chrome !== 'undefined')`. If you see this error, ensure you are running Jest (not Playwright) for the `tests/unit/` files.

### Integration tests are flaky on CI
- Playwright's bundled Chromium supports extensions in headless mode via `--headless=new`. Set `headless: false` → `headless: true` in `playwright.config.js` and add `--headless=new` to the `args` array:
  ```js
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--headless=new',
    `--disable-extensions-except=${path.resolve(__dirname)}`,
    `--load-extension=${path.resolve(__dirname)}`
  ]
  ```

---

## Adding New Tests

### New unit test
1. Create `tests/unit/<functionName>.test.js`.
2. `require('../../background.js')` or `require('../../content_script.js')` and destructure the exported function.
3. Jest auto-discovers any file matching `tests/unit/**/*.test.js`.

### New integration test
1. Create `tests/integration/<feature>.test.js`.
2. Import helpers from `./helpers/extensionHelper.js`.
3. Use `launchWithExtension()` in `beforeAll`, `clearStorage()` in `beforeEach`, and `context.close()` in `afterAll`.
4. Playwright auto-discovers any `.test.js` file inside `tests/integration/`.
