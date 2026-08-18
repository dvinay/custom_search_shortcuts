const { test, expect } = require('@playwright/test');
const { launchWithExtension, seedStorage, clearStorage, readStorage, waitBetweenTests } = require('./helpers/extensionHelper');

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

test.describe('Storage — URL CRUD', () => {
  test('stores a new URL entry and retrieves it', async () => {
    const url = { id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' };
    await seedStorage(serviceWorker, { urls: [url], favorites: [], categories: [], environments: [], settings: {} });

    const data = await readStorage(serviceWorker, { urls: [] });
    expect(data.urls).toHaveLength(1);
    expect(data.urls[0].name).toBe('GitHub');
    expect(data.urls[0].url).toBe('https://github.com/search?q=%s');
  });

  test('stores multiple URLs and preserves order', async () => {
    const urls = [
      { id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s', source: 'custom' },
      { id: 'u2', name: 'Google', url: 'https://www.google.com/search?q=%s', source: 'custom' },
      { id: 'u3', name: 'NPM', url: 'https://www.npmjs.com/search?q=%s', source: 'custom' }
    ];
    await seedStorage(serviceWorker, { urls });

    const data = await readStorage(serviceWorker, { urls: [] });
    expect(data.urls.map(u => u.id)).toEqual(['u1', 'u2', 'u3']);
  });

  test('updates a URL entry in storage', async () => {
    await seedStorage(serviceWorker, { urls: [{ id: 'u1', name: 'OldName', url: 'https://old.com/%s' }] });

    await serviceWorker.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.sync.get({ urls: [] }, (data) => {
          data.urls[0].name = 'NewName';
          chrome.storage.sync.set({ urls: data.urls }, resolve);
        });
      });
    });

    const data = await readStorage(serviceWorker, { urls: [] });
    expect(data.urls[0].name).toBe('NewName');
  });

  test('removes a URL entry from storage', async () => {
    const urls = [
      { id: 'u1', name: 'Keep', url: 'https://keep.com/%s' },
      { id: 'u2', name: 'Delete', url: 'https://delete.com/%s' }
    ];
    await seedStorage(serviceWorker, { urls });

    await serviceWorker.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.sync.get({ urls: [] }, (data) => {
          chrome.storage.sync.set({ urls: data.urls.filter(u => u.id !== 'u2') }, resolve);
        });
      });
    });

    const data = await readStorage(serviceWorker, { urls: [] });
    expect(data.urls).toHaveLength(1);
    expect(data.urls[0].id).toBe('u1');
  });
});

test.describe('Storage — Favorites', () => {
  test('adds a URL to favorites', async () => {
    await seedStorage(serviceWorker, {
      urls: [{ id: 'u1', name: 'GitHub', url: 'https://github.com/search?q=%s' }],
      favorites: []
    });

    await serviceWorker.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.sync.get({ favorites: [] }, (data) => {
          data.favorites.push('u1');
          chrome.storage.sync.set({ favorites: data.favorites }, resolve);
        });
      });
    });

    const data = await readStorage(serviceWorker, { favorites: [] });
    expect(data.favorites).toContain('u1');
  });

  test('removes a URL from favorites', async () => {
    await seedStorage(serviceWorker, { favorites: ['u1', 'u2'] });

    await serviceWorker.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.sync.get({ favorites: [] }, (data) => {
          chrome.storage.sync.set({ favorites: data.favorites.filter(id => id !== 'u1') }, resolve);
        });
      });
    });

    const data = await readStorage(serviceWorker, { favorites: [] });
    expect(data.favorites).not.toContain('u1');
    expect(data.favorites).toContain('u2');
  });
});

test.describe('Storage — Categories', () => {
  test('stores a category and retrieves it', async () => {
    const categories = [{ id: 'c1', name: 'Developer', icon: '💻' }];
    await seedStorage(serviceWorker, { categories });

    const data = await readStorage(serviceWorker, { categories: [] });
    expect(data.categories[0].name).toBe('Developer');
    expect(data.categories[0].icon).toBe('💻');
  });
});

test.describe('Storage — Settings', () => {
  test('stores and retrieves settings', async () => {
    const settings = { tabPosition: 'end', contextMenuOrder: ['favorites', 'urls'], popupQueryBar: true };
    await seedStorage(serviceWorker, { settings });

    const data = await readStorage(serviceWorker, { settings: {} });
    expect(data.settings.tabPosition).toBe('end');
    expect(data.settings.popupQueryBar).toBe(true);
  });
});
