const { test, expect } = require('@playwright/test');
const { launchWithExtension, seedStorage, clearStorage, waitBetweenTests } = require('./helpers/extensionHelper');

let context, serviceWorker;

test.beforeAll(async () => {
  ({ context, serviceWorker } = await launchWithExtension());
});

test.afterAll(async () => {
  await context.close();
});

test.beforeEach(async () => {
  await waitBetweenTests();
  await clearStorage(serviceWorker);
});

/**
 * Helper: triggers loadMenuItems() via the service worker and asserts no runtime error.
 */
async function reloadMenuItems(sw) {
  const error = await sw.evaluate(() => {
    return new Promise((resolve) => {
      try {
        loadMenuItems();
        resolve(null);
      } catch (e) {
        resolve(e.message);
      }
    });
  });
  return error;
}

test.describe('Context Menu — menu rebuild on storage change', () => {
  test('rebuilds context menu when a URL is added to storage', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' }],
      favorites: [], categories: [], environments: [], settings: {}
    });

    const error = await reloadMenuItems(serviceWorker);
    expect(error).toBeNull();
  });

  test('rebuilds context menu when favorites change', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' }],
      favorites: ['u1'], categories: [], environments: [], settings: {}
    });

    const error = await reloadMenuItems(serviceWorker);
    expect(error).toBeNull();
  });

  test('rebuilds context menu with no URLs without throwing', async () => {
    await seedStorage(serviceWorker, {
      urls: [], favorites: [], categories: [], environments: [], settings: {}
    });

    const error = await reloadMenuItems(serviceWorker);
    expect(error).toBeNull();
  });

  test('rebuilds context menu with preset URLs', async () => {
    await seedStorage(serviceWorker, {
      urls: [
        { id: 'p1', name: 'Google', url: 'https://www.google.com/search?q=%s', source: 'preset' },
        { id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' }
      ],
      favorites: [], categories: [], environments: [], settings: {}
    });

    const error = await reloadMenuItems(serviceWorker);
    expect(error).toBeNull();
  });

  test('rebuilds context menu with categories', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom', category: 'c1' }],
      categories: [{ id: 'c1', name: 'Developer', icon: '💻' }],
      favorites: [], environments: [], settings: {}
    });

    const error = await reloadMenuItems(serviceWorker);
    expect(error).toBeNull();
  });
});

test.describe('Context Menu — search URL construction', () => {
  test('substituteEnvVars in service worker replaces %s placeholder correctly', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' }],
      variables: [], environments: [], settings: {}
    });

    const finalUrl = await serviceWorker.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.sync.get({ urls: [], variables: [], environments: [] }, (data) => {
          const urlItem = data.urls[0];
          const resolved = substituteEnvVars(urlItem.url, 'NO_ENV', data.variables, data.environments);
          resolve(resolved.replaceAll('%s', encodeURIComponent('hello world')));
        });
      });
    });

    expect(finalUrl).toBe('https://github.com/search?q=hello%20world');
  });

  test('substituteEnvVars replaces environment variable placeholder with env value', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'Custom', url: 'https://{{host}}/search?q=%s', source: 'custom' }],
      variables: [{ name: 'host', defaultValue: 'default.example.com' }],
      environments: [{ id: 'env1', name: 'Prod', values: [{ key: 'host', value: 'prod.example.com' }] }],
      settings: {}
    });

    const finalUrl = await serviceWorker.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.sync.get({ urls: [], variables: [], environments: [] }, (data) => {
          const urlItem = data.urls[0];
          const resolved = substituteEnvVars(urlItem.url, 'env1', data.variables, data.environments);
          resolve(resolved.replaceAll('%s', encodeURIComponent('test')));
        });
      });
    });

    expect(finalUrl).toBe('https://prod.example.com/search?q=test');
  });
});
