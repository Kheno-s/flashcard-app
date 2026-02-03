import { test, expect } from '@playwright/test';

test('smoke: app loads and can navigate tabs', async ({ page }) => {
  await page.goto('/');

  // Tabs exist
  await expect(page.getByRole('tab', { name: /home/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /decks/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /review/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /import/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /stats/i })).toBeVisible();

  await page.getByRole('tab', { name: /import/i }).click();
  await expect(page.getByText('Import')).toBeVisible();

  await page.getByRole('tab', { name: /decks/i }).click();
  await expect(page.getByText('Decks')).toBeVisible();

  await page.getByRole('tab', { name: /review/i }).click();
  await expect(page.getByText('Review')).toBeVisible();

  await page.getByRole('tab', { name: /stats/i }).click();
  await expect(page.getByText('Stats')).toBeVisible();
});
