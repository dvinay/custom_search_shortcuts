const { chromium } = require('@playwright/test');
const path = require('path');

const EXTENSION_PATH = path.resolve(__dirname, '../../..');

/**
 * Launches a persistent Chrome context with the extension loaded.
 * @returns {{ context: import('@playwright/test').BrowserContext, extensionId: string }}
 */
async function launchWithExtension() {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  let serviceWorker = context.serviceWorkers().find(sw => sw.url().includes('background.js'));
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 10000 });
  }

  const extensionId = new URL(serviceWorker.url()).hostname;

  return { context, serviceWorker, extensionId };
}

/**
 * Seeds chrome.storage.sync with the given data via the service worker.
 * @param {import('@playwright/test').Worker} serviceWorker
 * @param {object} data
 */
async function seedStorage(serviceWorker, data) {
  await serviceWorker.evaluate((payload) => {
    return new Promise((resolve) => chrome.storage.sync.set(payload, resolve));
  }, data);
}

/**
 * Clears all chrome.storage.sync and chrome.storage.local data.
 * @param {import('@playwright/test').Worker} serviceWorker
 */
async function clearStorage(serviceWorker) {
  await serviceWorker.evaluate(() => {
    return Promise.all([
      new Promise(r => chrome.storage.sync.clear(r)),
      new Promise(r => chrome.storage.local.clear(r))
    ]);
  });
}

/**
 * Reads a value from chrome.storage.sync via the service worker.
 * @param {import('@playwright/test').Worker} serviceWorker
 * @param {object} defaults - Default values to pass to storage.get
 * @returns {Promise<object>}
 */
async function readStorage(serviceWorker, defaults) {
  return serviceWorker.evaluate((d) => {
    return new Promise(resolve => chrome.storage.sync.get(d, resolve));
  }, defaults);
}

/**
 * Pauses briefly before each test so runs can be visualised when running sequentially.
 * @param {number} ms - Delay in milliseconds (default 1500).
 */
async function waitBetweenTests(ms = 1500) {
  await new Promise(r => setTimeout(r, ms));
}

module.exports = { launchWithExtension, seedStorage, clearStorage, readStorage, waitBetweenTests, EXTENSION_PATH };
