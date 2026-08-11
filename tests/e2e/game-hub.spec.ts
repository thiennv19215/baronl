import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1000 } });

test('Game Store and Bamboo Battle manager render without page errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await mkdir('ui-snapshots', { recursive: true });

  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Điều khiển LIVE' })).toBeVisible();

  await page.getByRole('button', { name: /^Game/ }).click();
  const hub = page.getByLabel('Kho game LIVE');
  await expect(hub.getByText('GAME STORE', { exact: true })).toBeVisible();
  await expect(hub.getByRole('heading', { name: 'Chọn game để quản lý' })).toBeVisible();
  await page.screenshot({ path: 'ui-snapshots/game-store.png', fullPage: true });

  await hub.getByRole('button', { name: /Bamboo Battle/i }).click();
  await expect(hub.getByRole('heading', { name: 'Bamboo Battle', exact: true })).toBeVisible();
  await expect(hub.getByText('GAME 02', { exact: true })).toBeVisible();
  await expect(hub.getByRole('button', { name: /Kích hoạt game này|Đang sử dụng/ })).toBeVisible();
  await page.screenshot({ path: 'ui-snapshots/bamboo-battle-manager.png', fullPage: true });

  expect(pageErrors).toEqual([]);
});
