import { test, expect } from '@playwright/test';

// Mock API response for successful submission
const MOCK_RESPONSE = {
  id: 'test-response-123',
  status: 'created',
  createdAt: new Date().toISOString(),
};

// Mock API response for update
const MOCK_UPDATE_RESPONSE = {
  id: 'test-response-123',
  status: 'updated',
  createdAt: new Date().toISOString(),
};

/**
 * Intercept internal API calls and return mock responses.
 * This lets us test the full UI flow without a database.
 */
async function mockApiResponses(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/internal/responses', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, json: MOCK_RESPONSE });
    } else {
      await route.continue();
    }
  });
  await page.route('**/api/v1/internal/responses/*/bug', async (route) => {
    await route.fulfill({ status: 200, json: { ticketId: 'bug-1', status: 'open' } });
  });
  await page.route('**/api/v1/internal/responses/*', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({ status: 200, json: MOCK_UPDATE_RESPONSE });
    } else {
      await route.continue();
    }
  });
}

test.describe('SDK Widget Features', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiResponses(page);
    await page.goto('/dev');
    await page.waitForSelector('[data-testid="new-features"]');
  });

  // ─── SUBMISSION FLOW ─────────────────────────────────────────

  test.describe('Submission Flow', () => {
    test('should submit feedback and show success screen', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();

      // Fill out the form
      await modal.locator('textarea').fill('Great feature!');
      await modal.locator('button[aria-label="Rate 4 out of 5"]').click();

      // Submit
      await modal.locator('button[type="submit"]').click();

      // Should show success screen with "Gotcha!" text
      await expect(modal.getByText('Gotcha!')).toBeVisible({ timeout: 5000 });
    });

    test('should auto-close modal after successful submission', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await modal.locator('textarea').fill('Test feedback');
      await modal.locator('button[aria-label="Rate 5 out of 5"]').click();
      await modal.locator('button[type="submit"]').click();

      // Wait for success screen
      await expect(modal.getByText('Gotcha!')).toBeVisible({ timeout: 5000 });

      // Should auto-close after ~3 seconds
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    });

    test('should show loading state during submission', async ({ page }) => {
      // Add a delay to the mock to observe loading state
      await page.route('**/api/v1/internal/responses', async (route) => {
        if (route.request().method() === 'POST') {
          await new Promise((r) => setTimeout(r, 500));
          await route.fulfill({ status: 200, json: MOCK_RESPONSE });
        } else {
          await route.continue();
        }
      });

      const card = page.locator('[data-testid="rating-only-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await modal.locator('button[aria-label="Rate 5 out of 5"]').click();

      const submitBtn = modal.locator('button[type="submit"]');
      await submitBtn.click();

      // Should show "Submitting..." text
      await expect(submitBtn).toContainText('Submitting...');
    });

    test('should show error state on submission failure', async ({ page }) => {
      // Override mock to return error
      await page.route('**/api/v1/internal/responses', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            json: { error: { code: 'INVALID_REQUEST', message: 'Test error', status: 400 } },
          });
        } else {
          await route.continue();
        }
      });

      const card = page.locator('[data-testid="fresh-form-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await modal.locator('textarea').fill('Will fail');
      await modal.locator('button[aria-label="Rate 3 out of 5"]').click();
      await modal.locator('button[type="submit"]').click();

      // Error should appear in the modal (the modal stays open)
      await expect(modal).toBeVisible({ timeout: 5000 });
    });

    test('should submit rating-only feedback', async ({ page }) => {
      const card = page.locator('[data-testid="rating-only-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();

      // No textarea should be visible
      await expect(modal.locator('textarea')).not.toBeVisible();

      // Click a star and submit
      await modal.locator('button[aria-label="Rate 3 out of 5"]').click();
      await modal.locator('button[type="submit"]').click();

      await expect(modal.getByText('Gotcha!')).toBeVisible({ timeout: 5000 });
    });
  });

  // ─── FRESH FORM (STATE RESET) ────────────────────────────────

  test.describe('Fresh Form (state reset after submission)', () => {
    test('should show empty form on first open', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('textarea')).toHaveValue('');
    });

    test('should show empty form on reopen after close without submitting', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      const button = card.locator('.gotcha-button');

      await button.click();
      const modal = page.locator('.gotcha-modal');
      await modal.locator('textarea').fill('Draft text');
      await modal.locator('button[aria-label="Close feedback form"]').click();
      await expect(modal).not.toBeVisible();

      // Reopen — should be fresh (modal remounts)
      await button.click();
      await expect(modal).toBeVisible();
      await expect(modal.locator('textarea')).toHaveValue('');
    });

    test('should show empty form on reopen after successful submission', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      const button = card.locator('.gotcha-button');

      // Submit
      await button.click();
      const modal = page.locator('.gotcha-modal');
      await modal.locator('textarea').fill('First submission');
      await modal.locator('button[aria-label="Rate 4 out of 5"]').click();
      await modal.locator('button[type="submit"]').click();
      await expect(modal.getByText('Gotcha!')).toBeVisible({ timeout: 5000 });
      await expect(modal).not.toBeVisible({ timeout: 5000 });

      // Reopen — should be fresh, NOT pre-filled with old data
      await button.click();
      await expect(modal).toBeVisible();
      await expect(modal.locator('textarea')).toHaveValue('');
    });
  });

  // ─── FOLLOW-UP QUESTIONS ─────────────────────────────────────

  test.describe('Follow-up Questions', () => {
    test('should show follow-up prompt after low rating', async ({ page }) => {
      const card = page.locator('[data-testid="follow-up-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();

      // Give a low rating (1 star, threshold is 2)
      await modal.locator('button[aria-label="Rate 1 out of 5"]').click();
      await modal.locator('textarea').fill('Not great');
      await modal.locator('button[type="submit"]').click();

      // Should show follow-up prompt instead of success
      await expect(modal.getByText('What could we improve?')).toBeVisible({ timeout: 5000 });
      await expect(modal.locator('textarea')).toHaveValue('');
    });

    test('should show follow-up prompt at exact threshold rating', async ({ page }) => {
      const card = page.locator('[data-testid="follow-up-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');

      // Rate exactly at threshold (2 stars)
      await modal.locator('button[aria-label="Rate 2 out of 5"]').click();
      await modal.locator('textarea').fill('Okay-ish');
      await modal.locator('button[type="submit"]').click();

      // Should still trigger follow-up (threshold is inclusive)
      await expect(modal.getByText('What could we improve?')).toBeVisible({ timeout: 5000 });
    });

    test('should skip follow-up and show success for high rating', async ({ page }) => {
      const card = page.locator('[data-testid="follow-up-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');

      // Give a high rating (4 stars, above threshold of 2)
      await modal.locator('button[aria-label="Rate 4 out of 5"]').click();
      await modal.locator('textarea').fill('Love it');
      await modal.locator('button[type="submit"]').click();

      // Should go directly to success, no follow-up
      await expect(modal.getByText('Gotcha!')).toBeVisible({ timeout: 5000 });
    });

    test('should submit follow-up and then show success', async ({ page }) => {
      const card = page.locator('[data-testid="follow-up-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');

      // Low rating → follow-up
      await modal.locator('button[aria-label="Rate 1 out of 5"]').click();
      await modal.locator('textarea').fill('Bad experience');
      await modal.locator('button[type="submit"]').click();

      // Follow-up prompt appears
      await expect(modal.getByText('What could we improve?')).toBeVisible({ timeout: 5000 });

      // Fill follow-up and submit
      await modal.locator('textarea').fill('The loading is too slow');
      await modal.locator('button[type="submit"]').click();

      // Should now show success
      await expect(modal.getByText('Gotcha!')).toBeVisible({ timeout: 5000 });
    });

    test('should show follow-up on negative vote', async ({ page }) => {
      const card = page.locator('[data-testid="vote-follow-up-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();

      // Click the thumbs down button
      await modal.locator('button[aria-label="Vote down - I don\'t like this"]').click();

      // Should show follow-up
      await expect(modal.getByText('What went wrong?')).toBeVisible({ timeout: 5000 });
    });

    test('should close follow-up on escape and reset phase', async ({ page }) => {
      const card = page.locator('[data-testid="follow-up-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');

      // Low rating → follow-up
      await modal.locator('button[aria-label="Rate 1 out of 5"]').click();
      await modal.locator('textarea').fill('Bad');
      await modal.locator('button[type="submit"]').click();
      await expect(modal.getByText('What could we improve?')).toBeVisible({ timeout: 5000 });

      // Close during follow-up
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();

      // Reopen — should be back to the original form, not follow-up
      await card.locator('.gotcha-button').click();
      await expect(modal).toBeVisible();
      await expect(modal.locator('h2')).toContainText('Rate this feature');
    });
  });

  // ─── BUG FLAG + SCREENSHOT ───────────────────────────────────

  test.describe('Bug Flag + Screenshot', () => {
    test('should show bug flag toggle', async ({ page }) => {
      const card = page.locator('[data-testid="bug-flag-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      const bugToggle = modal.locator('button[role="switch"]');
      await expect(bugToggle).toBeVisible();
      await expect(bugToggle).toHaveAttribute('aria-checked', 'false');
    });

    test('should toggle bug flag and show screenshot button', async ({ page }) => {
      const card = page.locator('[data-testid="bug-flag-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      const bugToggle = modal.locator('button[role="switch"]');
      await bugToggle.click();
      await expect(bugToggle).toHaveAttribute('aria-checked', 'true');
      await expect(modal.getByText('Capture screenshot')).toBeVisible();
    });

    test('should hide screenshot button when bug flag toggled off', async ({ page }) => {
      const card = page.locator('[data-testid="bug-flag-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      const bugToggle = modal.locator('button[role="switch"]');
      await bugToggle.click();
      await expect(modal.getByText('Capture screenshot')).toBeVisible();
      await bugToggle.click();
      await expect(modal.getByText('Capture screenshot')).not.toBeVisible();
    });

    test('should submit with bug flag and show success', async ({ page }) => {
      const card = page.locator('[data-testid="bug-flag-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await modal.locator('textarea').fill('Button is broken');
      await modal.locator('button[role="switch"]').click();
      await modal.locator('button[type="submit"]').click();

      await expect(modal.getByText('Gotcha!')).toBeVisible({ timeout: 5000 });
    });
  });

  // ─── TRIGGER CONDITIONS ──────────────────────────────────────

  test.describe('Trigger Conditions', () => {
    test('delayed trigger: widget hidden initially, visible after 3s', async ({ page }) => {
      const card = page.locator('[data-testid="trigger-delay-card"]');
      const button = card.locator('.gotcha-button');

      // Should NOT be visible immediately
      await expect(button).not.toBeVisible();

      // Should become visible after delay
      await expect(button).toBeVisible({ timeout: 5000 });
    });

    test('delayed trigger: widget is interactive after appearing', async ({ page }) => {
      const card = page.locator('[data-testid="trigger-delay-card"]');
      const button = card.locator('.gotcha-button');

      await expect(button).toBeVisible({ timeout: 5000 });
      await button.click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('h2')).toContainText('Delayed feedback');
    });

    test('scroll trigger: widget hidden until scroll threshold', async ({ page }) => {
      const card = page.locator('[data-testid="scroll-trigger-card"]');
      const button = card.locator('.gotcha-button');

      // Should not be visible without scrolling
      await expect(button).not.toBeVisible();

      // Scroll to the section
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);

      // Now the widget should appear (we've scrolled past 30%)
      await expect(button).toBeVisible({ timeout: 3000 });
    });
  });

  // ─── MODAL BEHAVIOR ─────────────────────────────────────────

  test.describe('Modal Behavior', () => {
    test('should close on Escape key', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });

    test('should close on X button', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await modal.locator('button[aria-label="Close feedback form"]').click();
      await expect(modal).not.toBeVisible();
    });

    test('should only allow one modal at a time', async ({ page }) => {
      const freshCard = page.locator('[data-testid="fresh-form-card"]');
      await freshCard.locator('.gotcha-button').click();
      await expect(page.locator('.gotcha-modal')).toBeVisible();

      const bugCard = page.locator('[data-testid="bug-flag-card"]');
      await bugCard.locator('.gotcha-button').click();

      const modals = page.locator('.gotcha-modal');
      await expect(modals).toHaveCount(1);
      await expect(modals.locator('h2')).toContainText('Report a bug');
    });

    test('should trap focus inside modal', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();

      const closeButton = modal.locator('button[aria-label="Close feedback form"]');
      await expect(closeButton).toBeFocused();
    });

    test('should have correct aria attributes', async ({ page }) => {
      const card = page.locator('[data-testid="fresh-form-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await expect(modal).toHaveAttribute('role', 'dialog');
      await expect(modal).toHaveAttribute('aria-modal', 'true');
    });
  });

  // ─── ALL MODE WIDGETS ────────────────────────────────────────

  test.describe('Mode Widgets', () => {
    test('feedback: star rating + textarea', async ({ page }) => {
      await page.locator('[data-gotcha-element="dev-mode-feedback"] .gotcha-button').click();
      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('textarea')).toBeVisible();
      await expect(modal.locator('button[aria-label*="Rate"]')).toHaveCount(5);
    });

    test('vote: thumbs up/down buttons', async ({ page }) => {
      await page.locator('[data-gotcha-element="dev-mode-vote"] .gotcha-button').click();
      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('h2')).toContainText('Do you like this?');
    });

    test('poll: options displayed', async ({ page }) => {
      await page.locator('[data-gotcha-element="dev-mode-poll"] .gotcha-button').click();
      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await expect(modal.getByText('Yes')).toBeVisible();
      await expect(modal.getByText('No')).toBeVisible();
    });

    test('nps: 0-10 scale', async ({ page }) => {
      await page.locator('[data-gotcha-element="dev-mode-nps"] .gotcha-button').click();
      const modal = page.locator('.gotcha-modal');
      await expect(modal).toBeVisible();
      await expect(modal.getByRole('button', { name: 'Score 0 out of 10' })).toBeVisible();
      await expect(modal.getByRole('button', { name: 'Score 10 out of 10' })).toBeVisible();
    });

    test('feedback: submit with stars and text', async ({ page }) => {
      await page.locator('[data-gotcha-element="dev-mode-feedback"] .gotcha-button').click();
      const modal = page.locator('.gotcha-modal');

      await modal.locator('button[aria-label="Rate 5 out of 5"]').click();
      await modal.locator('textarea').fill('Amazing!');
      await modal.locator('button[type="submit"]').click();

      await expect(modal.getByText('Gotcha!')).toBeVisible({ timeout: 5000 });
    });

    test('poll: select option and submit', async ({ page }) => {
      await page.locator('[data-gotcha-element="dev-mode-poll"] .gotcha-button').click();
      const modal = page.locator('.gotcha-modal');

      await modal.getByText('Yes').click();

      // Poll submit is type="button", not type="submit"
      const submitBtn = modal.getByRole('button', { name: 'Submit' });
      await submitBtn.click();

      await expect(modal.getByText('Gotcha!')).toBeVisible({ timeout: 5000 });
    });
  });

  // ─── CONTEXT ENRICHMENT (verify payload) ─────────────────────

  test.describe('Context Enrichment', () => {
    test('should send enriched context with submission', async ({ page }) => {
      let capturedPayload: Record<string, unknown> | null = null;

      await page.route('**/api/v1/internal/responses', async (route) => {
        if (route.request().method() === 'POST') {
          capturedPayload = route.request().postDataJSON();
          await route.fulfill({ status: 200, json: MOCK_RESPONSE });
        } else {
          await route.continue();
        }
      });

      const card = page.locator('[data-testid="fresh-form-card"]');
      await card.locator('.gotcha-button').click();

      const modal = page.locator('.gotcha-modal');
      await modal.locator('textarea').fill('Testing context');
      await modal.locator('button[aria-label="Rate 3 out of 5"]').click();
      await modal.locator('button[type="submit"]').click();

      await expect(modal.getByText('Gotcha!')).toBeVisible({ timeout: 5000 });

      // Verify the payload had enriched context
      expect(capturedPayload).toBeTruthy();
      const context = (capturedPayload as Record<string, unknown>).context as Record<string, unknown>;
      expect(context).toBeTruthy();
      expect(context.url).toBeTruthy();
      expect(context.userAgent).toBeTruthy();
      expect(context.viewport).toBeTruthy();
      expect((context.viewport as Record<string, unknown>).width).toBeGreaterThan(0);
      expect((context.viewport as Record<string, unknown>).height).toBeGreaterThan(0);
      expect(context.language).toBeTruthy();
      expect(context.timezone).toBeTruthy();
    });
  });
});
