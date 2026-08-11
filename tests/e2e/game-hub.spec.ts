import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1000 } });

test('Game Store shows only installed games and opens each game as its own screen', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await mkdir('ui-snapshots', { recursive: true });

  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

  const app = page.getByLabel('OrbitStage Game Store');
  await expect(app).toBeVisible();
  await expect(page.locator('.sidebar')).toHaveCount(0);
  await expect(app.getByRole('heading', { name: 'Chọn game để quản lý' })).toHaveCount(0);
  await expect(app.locator('.game-store-hero')).toHaveCount(0);
  await expect(app.locator('.game-manager-hero')).toHaveCount(0);
  await expect(app.locator('.game-store-card')).toHaveCount(2);
  await expect(app.getByRole('button', { name: /Sàn nhảy tương tác/i })).toBeVisible();
  await expect(app.getByRole('button', { name: /Bamboo Battle/i })).toBeVisible();
  await page.screenshot({ path: 'ui-snapshots/game-store.png', fullPage: true });

  await app.getByRole('button', { name: /Sàn nhảy tương tác/i }).click();
  await expect(app.getByRole('heading', { name: 'Sàn nhảy tương tác', exact: true })).toBeVisible();
  await expect(app.getByText('Phong cách sân khấu', { exact: true })).toBeVisible();
  await expect(app.getByText('Thiết lập Sàn nhảy', { exact: true })).toBeVisible();
  await expect(app.locator('.game-store-card')).toHaveCount(0);
  await expect(app.getByRole('heading', { name: 'Bamboo Battle', exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'ui-snapshots/game-01-manager.png', fullPage: true });

  await app.getByRole('button', { name: /Kho game/i }).click();
  await expect(app.locator('.game-store-card')).toHaveCount(2);

  await app.getByRole('button', { name: /Bamboo Battle/i }).click();
  await expect(app.getByRole('heading', { name: 'Bamboo Battle', exact: true })).toBeVisible();
  await expect(app.getByText('Luật & kiểm thử Bamboo Battle', { exact: true })).toBeVisible();
  await expect(app.getByText('Thiết lập Bamboo Battle', { exact: true })).toBeVisible();
  await expect(app.getByRole('button', { name: /Kích hoạt game này|Đang sử dụng/ })).toBeVisible();
  await expect(app.locator('.game-store-card')).toHaveCount(0);
  await expect(app.getByRole('heading', { name: 'Sàn nhảy tương tác', exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'ui-snapshots/bamboo-battle-manager.png', fullPage: true });

  expect(pageErrors).toEqual([]);
});
