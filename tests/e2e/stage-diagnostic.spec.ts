import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';

const projectRoot = path.resolve(import.meta.dirname, '../..');

test('diagnose Stage renderer startup', async () => {
  const userDataDirectory = await mkdtemp(path.join(os.tmpdir(), 'orbitstage-stage-diag-'));
  const launchEnvironment = { ...process.env };
  delete launchEnvironment.ELECTRON_RUN_AS_NODE;
  launchEnvironment.ORBITSTAGE_E2E = '1';
  launchEnvironment.ORBITSTAGE_USER_DATA = userDataDirectory;

  let app: ElectronApplication | undefined;
  const errors: string[] = [];
  const consoles: string[] = [];
  try {
    app = await electron.launch({ args: [projectRoot], cwd: projectRoot, env: launchEnvironment, timeout: 30_000 });
    app.on('window', (page: Page) => {
      page.on('pageerror', (error) => errors.push(`${page.url()} :: ${error.stack ?? error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') consoles.push(`${page.url()} :: ${message.type()} :: ${message.text()}`);
      });
    });

    const control = await app.firstWindow();
    await control.waitForLoadState('domcontentloaded');
    const stageWindowPromise = app.waitForEvent('window');
    await control.getByRole('button', { name: /^Test LIVE/ }).click();
    await control.locator('header').getByRole('button', { name: 'Mở Stage', exact: true }).click();
    const stage = await stageWindowPromise;
    await stage.waitForLoadState('domcontentloaded');
    await stage.waitForTimeout(2500);

    const state = await stage.evaluate(() => ({
      href: location.href,
      title: document.title,
      readyState: document.readyState,
      rootHtml: document.querySelector('#root')?.innerHTML ?? null,
      bodyText: document.body.innerText.slice(0, 500),
      scripts: Array.from(document.scripts).map((script) => script.src),
    }));
    console.log('STAGE_DIAGNOSTIC_STATE', JSON.stringify(state, null, 2));
    console.log('STAGE_DIAGNOSTIC_PAGE_ERRORS', JSON.stringify(errors, null, 2));
    console.log('STAGE_DIAGNOSTIC_CONSOLE', JSON.stringify(consoles, null, 2));
    await expect(stage.locator('.stage')).toBeVisible({ timeout: 1_000 });
  } finally {
    await app?.close().catch(() => undefined);
    await rm(userDataDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
  }
});
