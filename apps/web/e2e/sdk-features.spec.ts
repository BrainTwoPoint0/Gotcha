import { test, expect } from '@playwright/test';

test.describe('SDK Widget Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev');
    await page.waitForSelector('[data-testid="new-features"]');
  });

  test.describe('Fresh Form (no state persistence)', () => {
    test('should show empty form on first open', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      const button = card.locator('.gotcha-button');
      await button.click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('h2')).toContainText('Fresh feedback every time');

      const textarea = modal.locator('textarea');
      await expect(textarea).toHaveValue('');
    });

    test('should show empty form on reopen after close', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      const button = card.locator('.gotcha-button');

      // Open, type something, close
      await button.click();
      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await modal.locator('textarea').fill('Some feedback');
      await modal.locator('button[aria-label="Close feedback form"]').click();
      await expect(modal).not.toBeVisible();

      // Reopen — should be fresh
      await button.click();
      await expect(modal).toBeVisible();
      await expect(modal.locator('textarea')).toHaveValue('');
    });
  });

  test.describe('Bug Flag + Screenshot', () => {
    test('should show bug flag toggle', async ({ page }) => {
      const card = page.locator('[data-testid="bug-flag-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();

      const bugToggle = modal.locator('button[role="switch"]');
      await expect(bugToggle).toBeVisible();
      await expect(bugToggle).toHaveAttribute('aria-checked', 'false');
    });

    test('should toggle bug flag on click', async ({ page }) => {
      const card = page.locator('[data-testid="bug-flag-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      const bugToggle = modal.locator('button[role="switch"]');
      await bugToggle.click();
      await expect(bugToggle).toHaveAttribute('aria-checked', 'true');
    });

    test('should show screenshot capture button when bug flag is toggled', async ({ page }) => {
      const card = page.locator('[data-testid="bug-flag-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      const bugToggle = modal.locator('button[role="switch"]');
      await bugToggle.click();

      // Screenshot capture button should appear
      const captureButton = modal.getByText('Capture screenshot');
      await expect(captureButton).toBeVisible();
    });

    test('should hide screenshot button when bug flag is toggled off', async ({ page }) => {
      const card = page.locator('[data-testid="bug-flag-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      const bugToggle = modal.locator('button[role="switch"]');

      // Toggle on
      await bugToggle.click();
      await expect(modal.getByText('Capture screenshot')).toBeVisible();

      // Toggle off
      await bugToggle.click();
      await expect(modal.getByText('Capture screenshot')).not.toBeVisible();
    });
  });

  test.describe('Follow-up Questions', () => {
    test('should show feedback form with star rating', async ({ page }) => {
      const card = page.locator('[data-testid="follow-up-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('h2')).toContainText('Rate this feature');

      // Star rating should be present
      const stars = modal.locator('button[aria-label*="Rate"]');
      await expect(stars).toHaveCount(5);
    });
  });

  test.describe('Delayed Trigger', () => {
    test('should not show widget immediately', async ({ page }) => {
      const card = page.locator('[data-testid="trigger-delay-card"]');
      // The gotcha button should NOT be visible yet (3s delay)
      const button = card.locator('.gotcha-button');
      await expect(button).not.toBeVisible();
    });

    test('should show widget after delay', async ({ page }) => {
      const card = page.locator('[data-testid="trigger-delay-card"]');
      const button = card.locator('.gotcha-button');

      // Wait for the 3-second delay
      await expect(button).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Modal Behavior', () => {
    test('should close on Escape key', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });

    test('should close on X button click', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();

      await modal.locator('button[aria-label="Close feedback form"]').click();
      await expect(modal).not.toBeVisible();
    });

    test('should only allow one modal open at a time', async ({ page }) => {
      // Open first modal
      const freshCard = page.locator('[data-testid="fresh-form-card"]');
      await freshCard.locator('.gotcha-button').click();
      await expect(page.locator('.gotcha-modal')).toBeVisible();

      // Open second modal — first should close
      const bugCard = page.locator('[data-testid="bug-flag-card"]');
      await bugCard.locator('.gotcha-button').click();

      // Should only be one modal visible
      const modals = page.locator('.gotcha-modal');
      await expect(modals).toHaveCount(1);
      await expect(modals.locator('h2')).toContainText('Report a bug');
    });

    test('should have focus trap', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();

      // First focusable element should be the close button
      const closeButton = modal.locator('button[aria-label="Close feedback form"]');
      await expect(closeButton).toBeFocused();
    });
  });

  test.describe('Existing Mode Widgets', () => {
    test('feedback mode should render with star rating and textarea', async ({ page }) => {
      const button = page.locator('[data-gotcha-element="dev-mode-feedback"] .gotcha-button');
      await button.click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('textarea')).toBeVisible();
      await expect(modal.locator('button[aria-label*="Rate"]')).toHaveCount(5);
    });

    test('vote mode should render with thumbs up/down', async ({ page }) => {
      const button = page.locator('[data-gotcha-element="dev-mode-vote"] .gotcha-button');
      await button.click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('h2')).toContainText('Do you like this?');
    });

    test('poll mode should render with options', async ({ page }) => {
      const button = page.locator('[data-gotcha-element="dev-mode-poll"] .gotcha-button');
      await button.click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await expect(modal.getByText('Yes')).toBeVisible();
      await expect(modal.getByText('No')).toBeVisible();
    });

    test('NPS mode should render with 0-10 scale', async ({ page }) => {
      const button = page.locator('[data-gotcha-element="dev-mode-nps"] .gotcha-button');
      await button.click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await expect(modal.getByRole('button', { name: 'Score 0 out of 10' })).toBeVisible();
      await expect(modal.getByRole('button', { name: 'Score 10 out of 10' })).toBeVisible();
    });
  });
});
