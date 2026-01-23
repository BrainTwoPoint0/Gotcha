import {
  welcomeEmail,
  proActivatedEmail,
  usageWarningEmail,
  responseAlertEmail,
} from '@/lib/emails/templates';

describe('Email Templates', () => {
  describe('welcomeEmail', () => {
    it('should generate welcome email with name', () => {
      const result = welcomeEmail({ name: 'John' });

      expect(result.subject).toBe('Welcome to Gotcha!');
      expect(result.html).toContain('Hey John');
      expect(result.html).toContain('npm install gotcha-feedback');
      expect(result.html).toContain('Go to Dashboard');
    });

    it('should use fallback when name is empty', () => {
      const result = welcomeEmail({ name: '' });

      expect(result.html).toContain('Hey there');
    });

    it('should include getting started steps', () => {
      const result = welcomeEmail({ name: 'Test' });

      expect(result.html).toContain('Create a project');
      expect(result.html).toContain('Install the SDK');
      expect(result.html).toContain('Add the G button');
    });
  });

  describe('proActivatedEmail', () => {
    it('should generate pro activation email with name and org', () => {
      const result = proActivatedEmail({ name: 'Jane', orgName: 'Acme Inc' });

      expect(result.subject).toBe("You're now on Gotcha Pro!");
      expect(result.html).toContain('Hey Jane');
      expect(result.html).toContain('Acme Inc');
      expect(result.html).toContain('Unlimited responses');
    });

    it('should use fallback when name is empty', () => {
      const result = proActivatedEmail({ name: '', orgName: 'Test Org' });

      expect(result.html).toContain('Hey there');
    });

    it('should list pro features', () => {
      const result = proActivatedEmail({ name: 'Test', orgName: 'Test Org' });

      expect(result.html).toContain('Unlimited responses');
      expect(result.html).toContain('Advanced analytics');
      expect(result.html).toContain('CSV/JSON export');
      expect(result.html).toContain('Priority support');
    });

    it('should include analytics link', () => {
      const result = proActivatedEmail({ name: 'Test', orgName: 'Test Org' });

      expect(result.html).toContain('https://gotcha.cx/dashboard/analytics');
    });
  });

  describe('usageWarningEmail', () => {
    it('should generate usage warning with correct numbers', () => {
      const result = usageWarningEmail({
        name: 'Bob',
        current: 400,
        limit: 500,
        percentage: 80,
      });

      expect(result.subject).toBe("You've used 80% of your monthly responses");
      expect(result.html).toContain('Hey Bob');
      expect(result.html).toContain('400 of 500');
      expect(result.html).toContain('80%');
    });

    it('should use fallback when name is empty', () => {
      const result = usageWarningEmail({
        name: '',
        current: 450,
        limit: 500,
        percentage: 90,
      });

      expect(result.html).toContain('Hey there');
    });

    it('should include upgrade CTA', () => {
      const result = usageWarningEmail({
        name: 'Test',
        current: 400,
        limit: 500,
        percentage: 80,
      });

      expect(result.html).toContain('Upgrade to Pro');
      expect(result.html).toContain('$29/month');
    });

    it('should warn about limit consequences', () => {
      const result = usageWarningEmail({
        name: 'Test',
        current: 400,
        limit: 500,
        percentage: 80,
      });

      expect(result.html).toContain("won't be recorded");
    });
  });

  describe('responseAlertEmail', () => {
    it('should generate response alert with content', () => {
      const result = responseAlertEmail({
        name: 'Alice',
        projectName: 'My App',
        responseType: 'FEEDBACK',
        content: 'Great feature!',
      });

      expect(result.subject).toBe('New feedback on My App');
      expect(result.html).toContain('Hey Alice');
      expect(result.html).toContain('My App');
      expect(result.html).toContain('Great feature!');
    });

    it('should use fallback when name is empty', () => {
      const result = responseAlertEmail({
        name: '',
        projectName: 'Test Project',
        responseType: 'VOTE',
        content: null,
      });

      expect(result.html).toContain('Hey there');
    });

    it('should format response type correctly', () => {
      const result = responseAlertEmail({
        name: 'Test',
        projectName: 'App',
        responseType: 'FEATURE_REQUEST',
        content: 'Need dark mode',
      });

      expect(result.subject).toBe('New feature request on App');
      expect(result.html).toContain('feature request');
    });

    it('should handle null content', () => {
      const result = responseAlertEmail({
        name: 'Test',
        projectName: 'App',
        responseType: 'VOTE',
        content: null,
      });

      expect(result.html).toContain('No text content provided');
    });

    it('should include view responses link', () => {
      const result = responseAlertEmail({
        name: 'Test',
        projectName: 'App',
        responseType: 'FEEDBACK',
        content: 'Test',
      });

      expect(result.html).toContain('https://gotcha.cx/dashboard/responses');
    });
  });
});
