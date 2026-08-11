import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';

const projectRoot = path.resolve(import.meta.dirname, '../..');

test('diagnose Bamboo Stage hydration', async () => {
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
    const controlState = await control.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { invoke: (channel: string, payload?: unknown) => Promise<any> } }).orbitStage;
      await bridge.invoke('config:patch', { stage: { gameMode: 'bamboo-battle', bambooRoundSeconds: 60, bambooAutoRestart: true } });
      return {
        config: await bridge.invoke('config:get'),
        snapshot: await bridge.invoke('stage:get-snapshot'),
      };
    });
    console.log('BAMBOO_DIAGNOSTIC_CONTROL', JSON.stringify(controlState, null, 2));

    const stageWindowPromise = app.waitForEvent('window');
    await control.locator('header').getByRole('button', { name: 'Mở Stage', exact: true }).click();
    const stage = await stageWindowPromise;
    await stage.waitForLoadState('domcontentloaded');
    await stage.waitForTimeout(1500);

    const stageState = await stage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage?: { getStageSnapshot?: () => Promise<any> } }).orbitStage;
      return {
        href: location.href,
        facade: Boolean(bridge),
        snapshot: await bridge?.getStageSnapshot?.(),
        bamboo: Boolean(document.querySelector('.bamboo-stage')),
        dance: Boolean(document.querySelector('.stage')),
        rootHtml: document.querySelector('#root')?.innerHTML.slice(0, 1200) ?? null,
      };
    });
    console.log('BAMBOO_DIAGNOSTIC_STAGE', JSON.stringify(stageState, null, 2));
    console.log('BAMBOO_DIAGNOSTIC_PAGE_ERRORS', JSON.stringify(errors, null, 2));
    console.log('BAMBOO_DIAGNOSTIC_CONSOLE', JSON.stringify(consoles, null, 2));
    await expect(stage.locator('.bamboo-stage')).toBeVisible({ timeout: 2_000 });
  } finally {
    await app?.close().catch(() => undefined);
    await rm(userDataDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
  }
});
