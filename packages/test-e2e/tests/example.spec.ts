import { test, expect } from '@playwright/test';

test('can do something', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const backpack = page.getByRole('button', {name: "backpack"});
  await backpack.click();
});
