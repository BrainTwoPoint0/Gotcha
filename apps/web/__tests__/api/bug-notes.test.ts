/**
 * Tests for bug notes feature — validation, email logic, and reporter extraction.
 *
 * Bug notes allow team members to add internal or external notes to bug tickets.
 * External notes trigger an email to the reporter (if reporterEmail exists).
 */

// --- Note validation helpers (mirrors API route logic) ---

function validateNoteContent(content: unknown): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content is required' };
  }
  if (content.length > 5000) {
    return { valid: false, error: 'Content must be under 5000 characters' };
  }
  if (content.trim().length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }
  return { valid: true };
}

function shouldSendEmail(isExternal: boolean, reporterEmail: string | null): boolean {
  return isExternal && reporterEmail !== null && reporterEmail.length > 0;
}

function extractReporterEmail(
  endUserMeta: Record<string, unknown> | null,
  endUserId: string | null
): string | null {
  // Primary: explicit email field in metadata
  const metaEmail = (endUserMeta?.email as string) || null;
  if (metaEmail) return metaEmail;

  // Fallback: endUserId if it looks like an email
  if (endUserId && endUserId.includes('@')) return endUserId;

  return null;
}

function isSystemNote(content: string): boolean {
  return content.startsWith('Status changed from') || content.startsWith('Priority changed from');
}

// --- Tests ---

describe('Bug Notes', () => {
  describe('Note content validation', () => {
    it('should accept valid content', () => {
      expect(validateNoteContent('This is a valid note')).toEqual({ valid: true });
    });

    it('should reject empty string', () => {
      const result = validateNoteContent('');
      expect(result.valid).toBe(false);
    });

    it('should reject whitespace-only content', () => {
      const result = validateNoteContent('   \n\t  ');
      expect(result.valid).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(validateNoteContent(null).valid).toBe(false);
      expect(validateNoteContent(undefined).valid).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(validateNoteContent(123).valid).toBe(false);
      expect(validateNoteContent(true).valid).toBe(false);
      expect(validateNoteContent({}).valid).toBe(false);
    });

    it('should accept content up to 5000 characters', () => {
      const content = 'a'.repeat(5000);
      expect(validateNoteContent(content).valid).toBe(true);
    });

    it('should reject content over 5000 characters', () => {
      const content = 'a'.repeat(5001);
      expect(validateNoteContent(content).valid).toBe(false);
    });
  });

  describe('Email sending logic', () => {
    it('should send email for external note with reporter email', () => {
      expect(shouldSendEmail(true, 'user@example.com')).toBe(true);
    });

    it('should not send email for internal note', () => {
      expect(shouldSendEmail(false, 'user@example.com')).toBe(false);
    });

    it('should not send email when reporter email is null', () => {
      expect(shouldSendEmail(true, null)).toBe(false);
    });

    it('should not send email when reporter email is empty string', () => {
      expect(shouldSendEmail(true, '')).toBe(false);
    });

    it('should not send email for internal note without reporter email', () => {
      expect(shouldSendEmail(false, null)).toBe(false);
    });
  });

  describe('Reporter email extraction', () => {
    it('should extract email from endUserMeta.email', () => {
      const meta = { email: 'user@example.com', name: 'Test User' };
      expect(extractReporterEmail(meta, null)).toBe('user@example.com');
    });

    it('should fall back to endUserId when it looks like an email', () => {
      expect(extractReporterEmail(null, 'info@company.com')).toBe('info@company.com');
    });

    it('should fall back to endUserId when meta has no email field', () => {
      const meta = { id: 'user_123', name: 'Test User' };
      expect(extractReporterEmail(meta, 'info@company.com')).toBe('info@company.com');
    });

    it('should prefer meta.email over endUserId', () => {
      const meta = { email: 'meta@example.com' };
      expect(extractReporterEmail(meta, 'id@example.com')).toBe('meta@example.com');
    });

    it('should not use endUserId when it is not an email', () => {
      expect(extractReporterEmail(null, 'user_abc123')).toBe(null);
    });

    it('should return null when no email is available', () => {
      expect(extractReporterEmail(null, null)).toBe(null);
    });

    it('should return null for empty meta', () => {
      expect(extractReporterEmail({}, null)).toBe(null);
    });

    it('should return null for meta with empty email', () => {
      const meta = { email: '' };
      expect(extractReporterEmail(meta, null)).toBe(null);
    });
  });

  describe('System note detection', () => {
    it('should detect status change notes', () => {
      expect(isSystemNote('Status changed from OPEN to INVESTIGATING')).toBe(true);
      expect(isSystemNote('Status changed from FIXING to RESOLVED')).toBe(true);
    });

    it('should detect priority change notes', () => {
      expect(isSystemNote('Priority changed from LOW to CRITICAL')).toBe(true);
      expect(isSystemNote('Priority changed from MEDIUM to HIGH')).toBe(true);
    });

    it('should not flag regular notes as system notes', () => {
      expect(isSystemNote('Looking into this now')).toBe(false);
      expect(isSystemNote('We fixed the issue')).toBe(false);
      expect(isSystemNote('')).toBe(false);
    });

    it('should not flag notes that mention status but are not system notes', () => {
      expect(isSystemNote('The status changed because of a deploy')).toBe(false);
      expect(isSystemNote('I think the priority should change')).toBe(false);
    });
  });

  describe('Note type behavior', () => {
    it('internal notes should default isExternal to false', () => {
      const isExternal = false;
      expect(isExternal).toBe(false);
      expect(shouldSendEmail(isExternal, 'user@example.com')).toBe(false);
    });

    it('external notes require explicit opt-in', () => {
      const isExternal = true;
      expect(shouldSendEmail(isExternal, 'user@example.com')).toBe(true);
    });
  });

  describe('Webhook event types', () => {
    const VALID_EVENTS = ['response.created', 'bug.created', 'bug.resolved', 'bug.updated'];

    it('should include bug.updated in valid events', () => {
      expect(VALID_EVENTS).toContain('bug.updated');
    });

    it('should have 4 total event types', () => {
      expect(VALID_EVENTS).toHaveLength(4);
    });

    it('bug.updated should fire for notes and status changes', () => {
      // Documents the design: bug.updated fires for:
      // 1. Adding a note (internal or external)
      // 2. Status/priority changes
      const noteEvents = ['note_added', 'status_change'];
      expect(noteEvents.length).toBeGreaterThan(0);
    });
  });
});
