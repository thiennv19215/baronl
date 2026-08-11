import { expect, test, type Page } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('Electron Stage resolves to the Stage BrowserWindow and bootstraps its React root', async () => {
  const userDataDirectory = await mkdtemp(path.join(tmpdir(), 'orbitstage-stage-diagnostic-'));
  const launchEnvironment = { ...process.env };
  delete launchEnvironment.ELECTRON_RUN_AS_NODE;
  launchEnvironment.ORBITSTAGE_E2E = '1';
  launchEnvironment.ORBITSTAGE_USER_DATA = userDataDirectory;

  const app = await electron.launch({ args: [projectRoot], cwd: projectRoot, env: launchEnvironment, timeout: 30_000 });
  try {
    const control = await app.firstWindow();
    await control.waitForLoadState('domcontentloaded');
    await expect(control.getByRole('heading', { level: 1, name: 'Điều khiển LIVE' })).toBeVisible();

    const observed: { page: Page; errors: string[]; console: string[] }[] = [];
    app.on('window', (page) => {
      const entry = { page, errors: [] as string[], console: [] as string[] };
      observed.push(entry);
      page.on('pageerror', (error) => entry.errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') entry.console.push(`${message.type()}: ${message.text()}`);
      });
    });

    await control.locator('header').getByRole('button', { name: 'Mở Stage', exact: true }).click();
    await expect.poll(() => app.windows().length, { timeout: 15_000 }).toBeGreaterThan(1);

    const windowMeta = await Promise.all(app.windows().map(async (page) => {
      const handle = await app.browserWindow(page);
      const browserWindow = await handle.evaluate((win) => ({
        title: win.getTitle(),
        url: win.webContents.getURL(),
        bounds: win.getBounds(),
      }));
      return { page, browserWindow, pageUrl: page.url(), pageTitle: await page.title() };
    }));

    const stageEntry = windowMeta.find((entry) => entry.browserWindow.title.includes('Stage 9:16'));
    if (!stageEntry) {
      throw new Error(`No Stage BrowserWindow found. Windows: ${JSON.stringify(windowMeta.map(({ browserWindow, pageUrl, pageTitle }) => ({ browserWindow, pageUrl, pageTitle })))}`);
    }

    const stagePage = stageEntry.page;
    await stagePage.waitForLoadState('domcontentloaded');
    const dom = await stagePage.evaluate(() => ({
      href: location.href,
      title: document.title,
      readyState: document.readyState,
      rootChildren: document.querySelector('#root')?.children.length ?? -1,
      rootHtml: document.querySelector('#root')?.innerHTML.slice(0, 600) ?? '<missing-root>',
      scripts: Array.from(document.scripts).map((script) => script.src || '<inline>'),
    }));
    const stageObserved = observed.find((entry) => entry.page === stagePage);

    await expect(stagePage.locator('.stage-viewport'), {
      message: `Stage bootstrap diagnostics: ${JSON.stringify({ browserWindow: stageEntry.browserWindow, dom, errors: stageObserved?.errors, console: stageObserved?.console })}`,
    }).toBeVisible({ timeout: 10_000 });
  } finally {
    await app.close().catch(() => undefined);
    await rm(userDataDirectory, { recursive: true, force: true });
  }
});
