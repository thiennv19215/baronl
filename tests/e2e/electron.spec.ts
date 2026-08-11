import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { _electron as electron, type ElectronApplication } from 'playwright';
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tempRoot = path.resolve(tmpdir());
const electronArgs = [
  projectRoot,
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--disable-gpu-sandbox',
];

const screens = [
  ['Điều khiển LIVE', 'Điều khiển LIVE'],
  ['LED sân khấu', 'LED sân khấu'],
  ['Game', 'Game'],
  ['Tùy chỉnh', 'Tùy chỉnh sân khấu'],
  ['Nhân vật', 'Nhân vật'],
  ['AI MC / DJ', 'AI MC / DJ'],
  ['Test LIVE', 'Test LIVE'],
] as const;

let electronApp: ElectronApplication;
let controlPage: Page;
let userDataDirectory: string;
let aiStub: Server;
let aiStubBaseUrl: string;

async function removeTemporaryProfile(directory: string): Promise<void> {
  const resolved = path.resolve(directory);
  const expected = path.dirname(resolved) === tempRoot && path.basename(resolved).startsWith('orbitstage-e2e-');
  if (!expected) throw new Error(`Refusing to remove unexpected E2E profile: ${resolved}`);
  await rm(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
}

async function attachPng(testInfo: TestInfo, name: string, page: Page, animations: 'allow' | 'disabled' = 'disabled') {
  await testInfo.attach(name, { body: await page.screenshot({ animations }), contentType: 'image/png' });
}

async function findStagePage(): Promise<Page | undefined> {
  for (const page of electronApp.windows()) {
    if (page === controlPage) continue;
    const handle = await electronApp.browserWindow(page);
    const meta = await handle.evaluate((win) => ({ title: win.getTitle(), url: win.webContents.getURL(), bounds: win.getBounds() }));
    if (
      meta.title === 'OrbitStage · OBS Stage'
      && meta.url.includes('/stage?')
      && meta.bounds.width === 540
      && meta.bounds.height === 960
    ) return page;
  }
  return undefined;
}

async function openStagePage(): Promise<Page> {
  await controlPage.locator('header').getByRole('button', { name: 'Mở Stage', exact: true }).click();
  await expect.poll(async () => Boolean(await findStagePage()), { timeout: 15_000 }).toBe(true);
  const page = await findStagePage();
  if (!page) throw new Error('Stage BrowserWindow opened but could not be resolved.');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('.stage-viewport')).toBeVisible({ timeout: 15_000 });
  return page;
}

async function closeStageWindows(): Promise<void> {
  for (const page of electronApp.windows()) {
    if (page !== controlPage) await page.close().catch(() => undefined);
  }
}

test.describe.serial('OrbitStage Electron V2', () => {
  test.beforeAll(async () => {
    aiStub = createServer((request, response) => {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      response.setHeader('Cache-Control', 'no-store');
      if (request.method === 'POST' && requestUrl.pathname === '/v1/responses') {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(JSON.stringify({ output_text: 'E2E AI caption: pipeline an toàn sẵn sàng.' }));
        return;
      }
      if (request.method === 'POST' && requestUrl.pathname === '/v1/audio/speech') {
        response.setHeader('Content-Type', 'audio/mpeg');
        response.end(Buffer.from('ID3\u0003\u0000\u0000\u0000\u0000\u0000\u000fE2E-TTS', 'binary'));
        return;
      }
      response.statusCode = 404;
      response.end();
    });
    await new Promise<void>((resolve, reject) => {
      aiStub.once('error', reject);
      aiStub.listen(0, '127.0.0.1', resolve);
    });
    const address = aiStub.address();
    if (!address || typeof address === 'string') throw new Error('Could not allocate local AI test server');
    aiStubBaseUrl = `http://127.0.0.1:${address.port}/v1`;

    userDataDirectory = await mkdtemp(path.join(tempRoot, 'orbitstage-e2e-'));
    const launchEnvironment = { ...process.env };
    delete launchEnvironment.ELECTRON_RUN_AS_NODE;
    launchEnvironment.ORBITSTAGE_E2E = '1';
    launchEnvironment.ORBITSTAGE_E2E_AI_KEY = 'e2e-local-test-token';
    launchEnvironment.ORBITSTAGE_USER_DATA = userDataDirectory;

    electronApp = await electron.launch({
      args: electronArgs,
      cwd: projectRoot,
      env: launchEnvironment,
      timeout: 30_000,
    });
    controlPage = await electronApp.firstWindow();
    await controlPage.waitForLoadState('domcontentloaded');
    await expect(controlPage.getByRole('heading', { level: 1, name: 'Điều khiển LIVE' })).toBeVisible();
  });

  test.afterAll(async () => {
    await electronApp?.close().catch(() => undefined);
    await new Promise<void>((resolve) => aiStub?.close(() => resolve()));
    if (userDataDirectory) await removeTemporaryProfile(userDataDirectory);
  });

  test('keeps preload isolated and exposes all seven Control screens', async ({}, testInfo) => {
    const security = await controlPage.evaluate(() => ({
      hasBridge: typeof window.orbitStage === 'object',
      hasNodeProcess: typeof (globalThis as typeof globalThis & { process?: unknown }).process !== 'undefined',
      hasRequire: typeof (globalThis as typeof globalThis & { require?: unknown }).require !== 'undefined',
    }));
    expect(security).toEqual({ hasBridge: true, hasNodeProcess: false, hasRequire: false });

    for (const [navigation, heading] of screens) {
      await controlPage.getByRole('button', { name: new RegExp(`^${navigation}`) }).click();
      await expect(controlPage.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
    await attachPng(testInfo, 'control-seven-tabs', controlPage);
  });

  test('opens the real 540x960 Stage and routes fake LIVE events through IPC', async ({}, testInfo) => {
    await closeStageWindows();
    await controlPage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { invoke: (channel: string, payload?: unknown) => Promise<unknown> } }).orbitStage;
      await bridge.invoke('config:patch', { stage: { gameMode: 'dance-floor', effectQuality: 'balanced' } });
    });

    const stagePage = await openStagePage();
    await expect(stagePage.locator('.stage')).toBeVisible();
    await expect(stagePage.locator('.three-stage canvas')).toBeVisible();
    await expect(stagePage.locator('.stage-logo')).toBeVisible();
    expect(new URL(stagePage.url()).searchParams.get('webglFallback')).not.toBe('1');

    await controlPage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { sendFakeEvent: (event: unknown) => Promise<unknown> } }).orbitStage;
      await bridge.sendFakeEvent({ type: 'join', viewer: { id: 'e2e-viewer', name: 'E2E Nova', level: 24 } });
      await bridge.sendFakeEvent({
        type: 'gift',
        viewer: { id: 'e2e-viewer', name: 'E2E Nova', level: 24 },
        giftName: 'E2E Comet',
        giftCount: 2,
        diamonds: 20,
        message: 'E2E pipeline đã kết nối',
      });
    });
    await expect(stagePage.getByRole('heading', { level: 2, name: 'E2E Comet' })).toBeVisible({ timeout: 8_000 });
    await expect(stagePage.getByText('E2E Nova', { exact: true }).first()).toBeVisible();
    await expect(stagePage.locator('.floor-actor').filter({ hasText: 'E2E Nova' })).toBeVisible();
    await attachPng(testInfo, 'stage-ipc-gift', stagePage, 'allow');
    await stagePage.close();
  });

  test('uses local AI and TTS stubs through the real Electron bridge', async () => {
    await closeStageWindows();
    const stagePage = await openStagePage();
    const localPort = await controlPage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { getSnapshot: () => Promise<{ localPort: number }> } }).orbitStage;
      return (await bridge.getSnapshot()).localPort;
    });

    await controlPage.evaluate(async ({ endpoint, musicPath }) => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { invoke: (channel: string, payload?: unknown) => Promise<unknown> } }).orbitStage;
      await bridge.invoke('config:patch', {
        ai: { enabled: true, provider: 'openai', endpoint, model: 'e2e-model', contentFilter: true, ttsProvider: 'openai' },
        music: {
          playlist: [{ id: 'e2e-loop', title: 'E2E Loop', path: musicPath, rights: 'placeholder' }],
          currentTrackId: 'e2e-loop',
          playing: true,
          volume: 42,
        },
      });
    }, { endpoint: aiStubBaseUrl, musicPath: `http://127.0.0.1:${localPort}/project-assets/music/placeholder-loop.wav` });

    const secretStatus = await controlPage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { invoke: (channel: string, payload?: unknown) => Promise<{ aiApiKey: boolean }> } }).orbitStage;
      return bridge.invoke('secret:status');
    });
    expect(secretStatus.aiApiKey).toBe(false);

    const aiResult = await controlPage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { invoke: (channel: string, payload?: unknown) => Promise<{ text: string }> } }).orbitStage;
      return bridge.invoke('ai:test', { prompt: 'Chào OrbitStage' });
    });
    expect(aiResult.text).toContain('E2E AI caption');
    await expect(stagePage.getByText('E2E AI caption: pipeline an toàn sẵn sàng.', { exact: true })).toBeVisible();

    await stagePage.evaluate(() => {
      const bridge = (globalThis as typeof globalThis & { orbitStage?: { subscribe?: (listener: (event: { type: string; payload?: unknown }) => void) => (() => void) } }).orbitStage;
      (globalThis as typeof globalThis & { __ttsEventPromise?: Promise<unknown> }).__ttsEventPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Did not receive TTS event')), 8_000);
        const unsubscribe = bridge?.subscribe?.((event) => {
          if (event.type !== 'tts-audio') return;
          clearTimeout(timer);
          unsubscribe?.();
          resolve(event.payload);
        });
      });
    });
    await controlPage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { invoke: (channel: string, payload?: unknown) => Promise<unknown> } }).orbitStage;
      await bridge.invoke('tts:test', { text: 'E2E TTS không chồng giọng' });
    });
    const ttsEvent = await stagePage.evaluate(() => (globalThis as typeof globalThis & { __ttsEventPromise: Promise<{ source?: string; text?: string }> }).__ttsEventPromise);
    expect(ttsEvent).toMatchObject({ source: 'test', text: 'E2E TTS không chồng giọng' });
    await stagePage.close();
  });

  test('runs Bamboo Battle V2 through IPC and the routed Game Store', async ({}, testInfo) => {
    await closeStageWindows();
    await controlPage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { invoke: (channel: string, payload?: unknown) => Promise<unknown> } }).orbitStage;
      await bridge.invoke('config:patch', {
        stage: { gameMode: 'bamboo-battle', effectQuality: 'balanced', bambooRoundSeconds: 60, bambooAutoRestart: true },
      });
    });

    const stagePage = await openStagePage();
    const battle = stagePage.getByLabel('Bamboo Battle V2');
    await expect(battle).toBeVisible();
    await expect(battle.locator('.bamboo-battle-3d canvas')).toBeVisible();

    await controlPage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { sendFakeEvent: (event: unknown) => Promise<unknown> } }).orbitStage;
      await bridge.sendFakeEvent({ type: 'chat', viewer: { id: 'green-e2e', name: 'Panda Xanh' }, message: '1' });
      await bridge.sendFakeEvent({ type: 'chat', viewer: { id: 'orange-e2e', name: 'Panda Cam' }, message: '2' });
      await bridge.sendFakeEvent({ type: 'like', viewer: { id: 'green-e2e', name: 'Panda Xanh' }, likeCount: 100 });
      await bridge.sendFakeEvent({ type: 'gift', viewer: { id: 'green-e2e', name: 'Panda Xanh' }, giftName: 'E2E Rose', giftCount: 2, diamonds: 10 });
    });
    await expect(battle.locator('.bamboo-v2-mvp.green')).toContainText('Panda Xanh');
    await expect(battle.locator('.bamboo-v2-mvp.orange')).toContainText('Panda Cam');
    await expect(battle.locator('.bamboo-v2-event')).toContainText('COMBO!');
    await attachPng(testInfo, 'stage-bamboo-battle-v2', stagePage, 'allow');

    await controlPage.getByRole('button', { name: /^Game/ }).click();
    const store = controlPage.getByLabel('OrbitStage Game Store');
    await expect(store.locator('.game-store-card')).toHaveCount(2);
    await store.getByRole('button', { name: /Bamboo Battle/i }).click();
    await store.getByRole('button', { name: 'Bắt đầu mô phỏng' }).click();
    await expect(store.getByRole('button', { name: 'Dừng mô phỏng' })).toBeVisible();
    await expect(store.getByText(/24 người · \d+ event/)).toBeVisible();
    await expect(battle.locator('.bamboo-v2-event')).toBeVisible();
    await store.getByRole('button', { name: 'Dừng mô phỏng' }).click();
    await expect(store.getByRole('button', { name: 'Bắt đầu mô phỏng' })).toBeVisible();
    await stagePage.close();
  });
});
