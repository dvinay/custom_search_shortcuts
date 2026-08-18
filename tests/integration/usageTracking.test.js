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

test.describe('Usage Tracking — recordUsage', () => {
  test('creates a usage entry with useCount=1 on first call', async () => {
    const data = await serviceWorker.evaluate(() => {
      return new Promise(resolve => {
        recordUsage('u1');
        setTimeout(() => {
          chrome.storage.local.get({ usage_u1: { lastUsed: 0, useCount: 0 } }, resolve);
        }, 200);
      });
    });

    expect(data.usage_u1.useCount).toBe(1);
    expect(data.usage_u1.lastUsed).toBeGreaterThan(0);
  });

  test('increments useCount on repeated calls', async () => {
    const data = await serviceWorker.evaluate(() => {
      return new Promise(resolve => {
        recordUsage('u2');
        recordUsage('u2');
        recordUsage('u2');
        setTimeout(() => {
          chrome.storage.local.get({ usage_u2: { lastUsed: 0, useCount: 0 } }, resolve);
        }, 400);
      });
    });

    expect(data.usage_u2.useCount).toBe(3);
  });

  test('does not create an entry when urlId is null', async () => {
    await serviceWorker.evaluate(() => recordUsage(null));
    await new Promise(r => setTimeout(r, 200));

    const data = await serviceWorker.evaluate(() => {
      return new Promise(resolve => chrome.storage.local.get(null, resolve));
    });

    const usageKeys = Object.keys(data).filter(k => k.startsWith('usage_'));
    expect(usageKeys).toHaveLength(0);
  });

  test('does not create an entry when urlId is undefined', async () => {
    await serviceWorker.evaluate(() => recordUsage(undefined));
    await new Promise(r => setTimeout(r, 200));

    const data = await serviceWorker.evaluate(() => {
      return new Promise(resolve => chrome.storage.local.get(null, resolve));
    });

    const usageKeys = Object.keys(data).filter(k => k.startsWith('usage_'));
    expect(usageKeys).toHaveLength(0);
  });

  test('tracks usage independently per URL', async () => {
    const data = await serviceWorker.evaluate(() => {
      return new Promise(resolve => {
        recordUsage('urlA');
        recordUsage('urlA');
        recordUsage('urlB');
        setTimeout(() => {
          chrome.storage.local.get(
            { usage_urlA: { lastUsed: 0, useCount: 0 }, usage_urlB: { lastUsed: 0, useCount: 0 } },
            resolve
          );
        }, 400);
      });
    });

    expect(data.usage_urlA.useCount).toBe(2);
    expect(data.usage_urlB.useCount).toBe(1);
  });

  test('updates lastUsed timestamp on each call', async () => {
    const before = Date.now();

    const data = await serviceWorker.evaluate(() => {
      return new Promise(resolve => {
        recordUsage('u3');
        setTimeout(() => {
          chrome.storage.local.get({ usage_u3: { lastUsed: 0, useCount: 0 } }, resolve);
        }, 200);
      });
    });

    expect(data.usage_u3.lastUsed).toBeGreaterThanOrEqual(before);
  });
});
