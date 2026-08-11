import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1000 } });

test('Game Store and Bamboo Battle manager render without page errors', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Điều khiển LIVE' })).toBeVisible();

  await page.getByRole('button', { name: /^Game/ }).click();
  await expect(page.getByText('GAME STORE', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Chọn game để quản lý' })).toBeVisible();

  await testInfo.attach('game-store', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await page.getByRole('button', { name: /Bamboo Battle/i }).click();
  await expect(page.getByRole('heading', { name: 'Bamboo Battle' })).toBeVisible();
  await expect(page.getByText('GAME 02', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Kích hoạt game này|Đang sử dụng/ })).toBeVisible();

  await testInfo.attach('bamboo-battle-manager', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  expect(pageErrors).toEqual([]);
});
