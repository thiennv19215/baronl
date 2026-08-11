import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1000 } });

test('Game workspace is a two-card store and each card opens a dedicated screen', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await mkdir('ui-snapshots', { recursive: true });

  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Điều khiển LIVE' })).toBeVisible();

  await page.getByRole('button', { name: /^Game/ }).click();

  const store = page.getByLabel('OrbitStage Game Store');
  await expect(store).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Game', exact: true })).toBeVisible();
  await expect(store.getByRole('heading', { name: 'Chọn game để quản lý' })).toHaveCount(0);
  await expect(store.locator('.game-store-hero')).toHaveCount(0);
  await expect(store.locator('.game-manager-hero')).toHaveCount(0);
  await expect(store.locator('.game-store-card')).toHaveCount(2);
  await expect(store.getByRole('button', { name: /Sàn nhảy tương tác/i })).toBeVisible();
  await expect(store.getByRole('button', { name: /Bamboo Battle/i })).toBeVisible();
  await page.screenshot({ path: 'ui-snapshots/game-store.png', fullPage: true });

  await store.getByRole('button', { name: /Sàn nhảy tương tác/i }).click();
  await expect(store.getByRole('heading', { name: 'Sàn nhảy tương tác', exact: true })).toBeVisible();
  await expect(store.getByText('Phong cách sân khấu', { exact: true })).toBeVisible();
  await expect(store.getByText('Thiết lập Sàn nhảy', { exact: true })).toBeVisible();
  await expect(store.locator('.game-store-card')).toHaveCount(0);
  await expect(store.getByRole('heading', { name: 'Bamboo Battle', exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'ui-snapshots/game-01-manager.png', fullPage: true });

  await store.getByRole('button', { name: /Kho game/i }).click();
  await expect(store.locator('.game-store-card')).toHaveCount(2);

  await store.getByRole('button', { name: /Bamboo Battle/i }).click();
  await expect(store.getByRole('heading', { name: 'Bamboo Battle', exact: true })).toBeVisible();
  await expect(store.getByText('Luật & kiểm thử Bamboo Battle', { exact: true })).toBeVisible();
  await expect(store.getByText('Thiết lập Bamboo Battle', { exact: true })).toBeVisible();
  await expect(store.getByRole('button', { name: /Kích hoạt game này|Đang sử dụng/ })).toBeVisible();
  await expect(store.locator('.game-store-card')).toHaveCount(0);
  await expect(store.getByRole('heading', { name: 'Sàn nhảy tương tác', exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'ui-snapshots/bamboo-battle-manager.png', fullPage: true });

  expect(pageErrors).toEqual([]);
});
