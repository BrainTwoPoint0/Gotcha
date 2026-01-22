import { test, expect } from '@playwright/test';

test.describe('Marketing Pages', () => {
  test.describe('Homepage', () => {
    test('should display hero section', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have navigation links', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('link', { name: /pricing/i }).first()).toBeVisible();
    });

    test('should navigate to pricing page', async ({ page }) => {
      await page.goto('/');

      await page
        .getByRole('link', { name: /pricing/i })
        .first()
        .click();
      await expect(page).toHaveURL('/pricing');
    });
  });

  test.describe('Pricing Page', () => {
    test('should display pricing tiers', async ({ page }) => {
      await page.goto('/pricing');

      await expect(page.getByRole('heading', { name: 'Free', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Pro', exact: true })).toBeVisible();
    });

    test('should display Free tier details', async ({ page }) => {
      await page.goto('/pricing');

      await expect(page.getByText('$0', { exact: true })).toBeVisible();
      await expect(page.getByText('500 responses/month')).toBeVisible();
    });

    test('should display Pro tier details', async ({ page }) => {
      await page.goto('/pricing');

      await expect(page.getByText('$29')).toBeVisible();
      await expect(page.getByText('Unlimited responses', { exact: true })).toBeVisible();
    });

    test('should have CTA buttons', async ({ page }) => {
      await page.goto('/pricing');

      const ctaButtons = page.getByRole('link', { name: /get started/i });
      await expect(ctaButtons.first()).toBeVisible();
    });

    test('should display FAQ section', async ({ page }) => {
      await page.goto('/pricing');

      await expect(page.getByText(/frequently asked questions/i)).toBeVisible();
    });
  });

  test.describe('Demo Page', () => {
    test('should display demo content', async ({ page }) => {
      await page.goto('/demo');

      await expect(page.getByRole('heading', { name: /sdk playground/i })).toBeVisible();
    });
  });
});
