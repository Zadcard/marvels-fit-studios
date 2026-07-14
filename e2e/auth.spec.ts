import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Marvel/i);
  });
});

test.describe('Login', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Client ID or phone number')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  });
});

test.describe('Authentication', () => {
  test('should reject invalid credentials', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/login');
    await page.getByRole('tab', { name: 'Email' }).click();
    await page.getByLabel('Email address').fill('invalid@test.com');
    await page.getByLabel('Password', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 45_000 });
  });
});
