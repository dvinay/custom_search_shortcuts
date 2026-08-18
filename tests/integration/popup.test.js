const { test, expect } = require('@playwright/test');
const { launchWithExtension, seedStorage, clearStorage, waitBetweenTests, EXTENSION_PATH } = require('./helpers/extensionHelper');
const path = require('path');

let context, serviceWorker, extensionId;

test.beforeAll(async () => {
  ({ context, serviceWorker, extensionId } = await launchWithExtension());
});

test.afterAll(async () => {
  await context.close();
});

test.beforeEach(async () => {
  await waitBetweenTests();
  await clearStorage(serviceWorker);
});

async function openPopup(ctx, extId) {
  const popupUrl = `chrome-extension://${extId}/popup.html`;
  const page = await ctx.newPage();
  await page.goto(popupUrl);
  await page.waitForLoadState('domcontentloaded');
  return page;
}

test.describe('Popup — empty state', () => {
  test('shows empty state when no shortcuts are configured', async () => {
    await seedStorage(serviceWorker, { urls: [], favorites: [], categories: [], variables: [], settings: {} });

    const page = await openPopup(context, extensionId);
    const emptyState = page.locator('#empty-state');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
    await page.close();
  });
});

test.describe('Popup — shortcut list rendering', () => {
  test('renders a shortcut button for each configured URL', async () => {
    await seedStorage(serviceWorker, {
      urls: [
        { id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' },
        { id: 'u2', name: 'Google', url: 'https://www.google.com/search?q=%s', source: 'custom' }
      ],
      favorites: [], categories: [], variables: [], settings: {}
    });

    const page = await openPopup(context, extensionId);
    const items = page.locator('.shortcut-item');
    await expect(items).toHaveCount(2, { timeout: 5000 });
    await page.close();
  });

  test('renders the correct shortcut name', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=%s', source: 'custom' }],
      favorites: [], categories: [], variables: [], settings: {}
    });

    const page = await openPopup(context, extensionId);
    const nameEl = page.locator('.shortcut-name').first();
    await expect(nameEl).toHaveText('Stack Overflow', { timeout: 5000 });
    await page.close();
  });

  test('renders the domain in the subtitle', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' }],
      favorites: [], categories: [], variables: [], settings: {}
    });

    const page = await openPopup(context, extensionId);
    const urlEl = page.locator('.shortcut-url').first();
    await expect(urlEl).toContainText('github.com', { timeout: 5000 });
    await page.close();
  });
});

test.describe('Popup — favorites section', () => {
  test('shows Favorites section header when a URL is favorited', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' }],
      favorites: ['u1'], categories: [], variables: [], settings: {}
    });

    const page = await openPopup(context, extensionId);
    const headers = page.locator('.category-group-header');
    const texts = await headers.allTextContents();
    expect(texts.some(t => t.includes('Favorites'))).toBe(true);
    await page.close();
  });

  test('active star icon is shown for a favorited shortcut', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' }],
      favorites: ['u1'], categories: [], variables: [], settings: {}
    });

    const page = await openPopup(context, extensionId);
    const activeStar = page.locator('.fav-star.active');
    await expect(activeStar).toHaveCount(1, { timeout: 5000 });
    await page.close();
  });
});

test.describe('Popup — search filter', () => {
  test('filters shortcut list by name when typing in the search input', async () => {
    await seedStorage(serviceWorker, {
      urls: [
        { id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' },
        { id: 'u2', name: 'Google', url: 'https://www.google.com/search?q=%s', source: 'custom' },
        { id: 'u3', name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=%s', source: 'custom' }
      ],
      favorites: [], categories: [], variables: [], settings: {}
    });

    const page = await openPopup(context, extensionId);
    await page.locator('#search-input').fill('git');

    const items = page.locator('.shortcut-item');
    await expect(items).toHaveCount(1, { timeout: 5000 });
    await expect(page.locator('.shortcut-name').first()).toHaveText('GitHub');
    await page.close();
  });

  test('shows no-match message when filter matches nothing', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' }],
      favorites: [], categories: [], variables: [], settings: {}
    });

    const page = await openPopup(context, extensionId);
    await page.locator('#search-input').fill('zzzzz');
    const noMatch = page.locator('#shortcuts-list');
    await expect(noMatch).toContainText('No matching shortcuts', { timeout: 5000 });
    await page.close();
  });
});

test.describe('Popup — query bar', () => {
  test('query bar becomes visible when Tab is pressed in search input', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' }],
      favorites: [], categories: [], variables: [], settings: {}
    });

    const page = await openPopup(context, extensionId);
    await page.locator('#search-input').click();
    await page.keyboard.press('Tab');

    const queryBar = page.locator('#query-bar');
    await expect(queryBar).toBeVisible({ timeout: 3000 });
    await page.close();
  });

  test('query bar hides when clear button is clicked', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' }],
      favorites: [], categories: [], variables: [], settings: {}
    });

    const page = await openPopup(context, extensionId);
    await page.locator('#search-input').click();
    await page.keyboard.press('Tab');
    await page.locator('#query-clear-btn').click();

    const queryBar = page.locator('#query-bar');
    await expect(queryBar).toBeHidden({ timeout: 3000 });
    await page.close();
  });
});

test.describe('Popup — sort pills', () => {
  test('most-used pill can be clicked without error', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' }],
      favorites: [], categories: [], variables: [], settings: {}
    });

    const page = await openPopup(context, extensionId);
    await page.locator('#sort-most-used').click();
    await expect(page.locator('#sort-most-used')).toHaveClass(/active/, { timeout: 3000 });
    await page.close();
  });

  test('recent pill can be clicked without error', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' }],
      favorites: [], categories: [], variables: [], settings: {}
    });

    const page = await openPopup(context, extensionId);
    await page.locator('#sort-recent').click();
    await expect(page.locator('#sort-recent')).toHaveClass(/active/, { timeout: 3000 });
    await page.close();
  });
});
