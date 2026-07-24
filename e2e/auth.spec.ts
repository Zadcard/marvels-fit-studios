import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Marvel/i);
  });
});

test.describe('Login UI', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  });
});

test.describe('Authentication & Route Protection', () => {
  test('should reject invalid credentials', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/login');
    await page.getByLabel('Email address').fill('invalid@test.com');
    await page.getByLabel('Password', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 45_000 });
  });

  for (const route of ['/admin', '/coach', '/ops']) {
    test(`redirects anonymous visitors away from ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test('should log in successfully as Lead Admin', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin1@marvelsfit.com');
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 45_000 });
  });

  test('should log in successfully as Coach', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/login');
    await page.getByLabel('Email address').fill('coach.ahmed@marvelsfit.com');
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/coach/, { timeout: 45_000 });
  });
});
