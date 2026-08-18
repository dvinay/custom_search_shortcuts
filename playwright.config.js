const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests/integration',
  timeout: 30000,
  retries: 1,
  workers: 1,
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'tests/integration/report', open: 'never' }]],
  use: {
    headless: false,
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--disable-extensions-except=${path.resolve(__dirname)}`,
        `--load-extension=${path.resolve(__dirname)}`
      ]
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ]
});
