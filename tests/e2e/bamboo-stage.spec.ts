import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 540, height: 960 } });

test('Bamboo Battle Stage renders 3D canvas, HUD and gift skill in 9:16', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await mkdir('ui-snapshots', { recursive: true });

  await page.addInitScript(() => {
    const runtimeWindow = window as typeof window & {
      __stageEmit?: (event: unknown) => void;
      orbitStage?: unknown;
    };

    runtimeWindow.orbitStage = {
      getStageSnapshot: async () => ({
        live: true,
        viewerCount: 128,
        appearance: {
          gameMode: 'bamboo-battle',
          bambooRoundSeconds: 60,
          bambooAutoRestart: true,
          bambooLikePower: 0.08,
          bambooGiftPower: 0.8,
          bambooGreenCharacter: 'bear',
          bambooOrangeCharacter: 'dog',
        },
      }),
      subscribe: (listener: (event: unknown) => void) => {
        runtimeWindow.__stageEmit = listener;
        return () => {
          if (runtimeWindow.__stageEmit === listener) runtimeWindow.__stageEmit = undefined;
        };
      },
    };
  });

  await page.goto('http://127.0.0.1:4174/?transport=ipc&reconnect=0', { waitUntil: 'networkidle' });

  const stage = page.getByLabel('Bamboo Battle V2');
  await expect(stage).toBeVisible();
  await expect(stage.locator('.bamboo-battle-3d canvas')).toBeVisible();
  await expect(stage.getByText('PHE XANH', { exact: false })).toBeVisible();
  await expect(stage.getByText('PHE CAM', { exact: false })).toBeVisible();

  await page.evaluate(() => {
    const emit = (window as typeof window & { __stageEmit?: (event: unknown) => void }).__stageEmit;
    if (!emit) throw new Error('Stage facade listener was not registered.');
    const now = Date.now();
    emit({ type: 'chat', timestamp: now, payload: { userId: 'green-test', nickname: 'Green Test', comment: '1' } });
    emit({ type: 'chat', timestamp: now + 1, payload: { userId: 'orange-test', nickname: 'Orange Test', comment: '2' } });
    emit({ type: 'gift', timestamp: now + 2, payload: { userId: 'green-test', nickname: 'Green Test', giftName: 'Stage Audit Gift', count: 1, diamonds: 100 } });
  });

  await expect(stage.locator('.bamboo-v2-event')).toContainText('HEAVY ATTACK!');
  await expect(stage.locator('.bamboo-v2-event')).toContainText('Green Test');
  await page.screenshot({ path: 'ui-snapshots/bamboo-stage-9x16.png', fullPage: true });

  expect(pageErrors).toEqual([]);
});
