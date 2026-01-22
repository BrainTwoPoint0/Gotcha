import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should display GitHub login button', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();
    });

    test('should show link to signup page', async ({ page }) => {
      await page.goto('/login');

      const signupLink = page.getByRole('link', { name: /create a new account/i });
      await expect(signupLink).toBeVisible();
      await signupLink.click();

      await expect(page).toHaveURL('/signup');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should show an error message
      await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Signup Page', () => {
    test('should display signup form', async ({ page }) => {
      await page.goto('/signup');

      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('#confirmPassword')).toBeVisible();
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('should display GitHub signup button', async ({ page }) => {
      await page.goto('/signup');

      await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();
    });

    test('should show link to login page', async ({ page }) => {
      await page.goto('/signup');

      const loginLink = page.getByRole('link', { name: /sign in/i });
      await expect(loginLink).toBeVisible();
      await loginLink.click();

      await expect(page).toHaveURL('/login');
    });

    test('should validate password confirmation', async ({ page }) => {
      await page.goto('/signup');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.locator('#password').fill('password123');
      await page.locator('#confirmPassword').fill('different');
      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test('should validate password length', async ({ page }) => {
      await page.goto('/signup');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.locator('#password').fill('12345');
      await page.locator('#confirmPassword').fill('12345');
      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page).toHaveURL('/login');
    });

    test('should redirect unauthenticated users from projects to login', async ({ page }) => {
      await page.goto('/dashboard/projects');

      await expect(page).toHaveURL('/login');
    });

    test('should redirect unauthenticated users from settings to login', async ({ page }) => {
      await page.goto('/dashboard/settings');

      await expect(page).toHaveURL('/login');
    });
  });
});
