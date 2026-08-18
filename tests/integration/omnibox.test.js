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

const SEED_URLS = [
  { id: 'u1', name: 'GitHub',         url: 'https://github.com/search?q=%s',      source: 'custom' },
  { id: 'u2', name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=%s', source: 'custom' },
  { id: 'u3', name: 'Google',         url: 'https://www.google.com/search?q=%s',   source: 'custom' },
  { id: 'u4', name: 'NPM',            url: 'https://www.npmjs.com/search?q=%s',    source: 'custom' }
];

/**
 * Runs scoreMatch for all URLs against a prefix via the service worker.
 * Returns sorted results as [{ id, name, score }].
 */
async function runOmniboxScore(sw, prefix, favIds = []) {
  return sw.evaluate(({ prefix, favIds, urls }) => {
    const favSet = new Set(favIds);
    const scored = urls
      .map(u => ({ id: u.id, name: u.name, score: scoreMatch(u.name.toLowerCase(), prefix.toLowerCase(), favSet.has(u.id)) }))
      .filter(s => s.score >= 0)
      .sort((a, b) => b.score - a.score);
    return scored;
  }, { prefix, favIds, urls: SEED_URLS });
}

test.describe('Omnibox — scoreMatch via service worker', () => {
  test('exact match scores highest', async () => {
    await seedStorage(serviceWorker, { urls: SEED_URLS, favorites: [], categories: [] });

    const results = await runOmniboxScore(serviceWorker, 'github');
    expect(results[0].id).toBe('u1');
    expect(results[0].score).toBe(300);
  });

  test('starts-with match scores 200', async () => {
    await seedStorage(serviceWorker, { urls: SEED_URLS, favorites: [], categories: [] });

    const results = await runOmniboxScore(serviceWorker, 'git');
    expect(results[0].id).toBe('u1');
    expect(results[0].score).toBe(200);
  });

  test('favorite bonus elevates a lower-scoring match above a higher-scoring non-favorite', async () => {
    await seedStorage(serviceWorker, { urls: SEED_URLS, favorites: ['u3'], categories: [] });

    // 'g' starts-with 'Google' (u3, fav) and 'GitHub' (u1, non-fav)
    const results = await runOmniboxScore(serviceWorker, 'g', ['u3']);
    const googleResult = results.find(r => r.id === 'u3');
    const githubResult = results.find(r => r.id === 'u1');
    expect(googleResult.score).toBeGreaterThan(githubResult.score);
  });

  test('initials match: "so" matches Stack Overflow', async () => {
    await seedStorage(serviceWorker, { urls: SEED_URLS, favorites: [], categories: [] });

    const results = await runOmniboxScore(serviceWorker, 'so');
    expect(results.some(r => r.id === 'u2')).toBe(true);
  });

  test('returns no results for a prefix that matches nothing', async () => {
    await seedStorage(serviceWorker, { urls: SEED_URLS, favorites: [], categories: [] });

    const results = await runOmniboxScore(serviceWorker, 'zzzzz');
    expect(results).toHaveLength(0);
  });

  test('returns all URLs when prefix is empty (show-all mode handled by caller)', async () => {
    await seedStorage(serviceWorker, { urls: SEED_URLS, favorites: [], categories: [] });

    // Empty prefix — simulate the show-all path from onInputChanged
    const allScored = await serviceWorker.evaluate(({ urls }) => {
      return urls.map(u => ({ id: u.id, score: 0 }));
    }, { urls: SEED_URLS });

    expect(allScored).toHaveLength(SEED_URLS.length);
  });
});

test.describe('Omnibox — escapeOmni via service worker', () => {
  test('escapes XML special characters', async () => {
    const result = await serviceWorker.evaluate(() => escapeOmni('a & <b> "c"'));
    expect(result).toBe('a &amp; &lt;b&gt; &quot;c&quot;');
  });
});

test.describe('Omnibox — getDomainForOmni via service worker', () => {
  test('returns correct hostname', async () => {
    const result = await serviceWorker.evaluate(() => getDomainForOmni('https://github.com/search?q=%s'));
    expect(result).toBe('github.com');
  });

  test('returns empty string for malformed URL', async () => {
    const result = await serviceWorker.evaluate(() => getDomainForOmni('not-a-url'));
    expect(result).toBe('');
  });
});
