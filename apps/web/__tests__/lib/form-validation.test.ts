/**
 * Tests for client-side form validation logic
 */

describe('Form Validation', () => {
  describe('Email Validation', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should accept valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.com')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
      expect(isValidEmail('user@subdomain.example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
      expect(isValidEmail('user@example')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    interface PasswordValidation {
      isValid: boolean;
      errors: string[];
    }

    const validatePassword = (password: string): PasswordValidation => {
      const errors: string[] = [];

      if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }

      if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
      }

      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    };

    it('should accept strong passwords', () => {
      expect(validatePassword('SecurePass123').isValid).toBe(true);
      expect(validatePassword('MyP@ssw0rd!').isValid).toBe(true);
    });

    it('should reject short passwords', () => {
      const result = validatePassword('Short1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should require uppercase', () => {
      const result = validatePassword('lowercase123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase', () => {
      const result = validatePassword('UPPERCASE123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require numbers', () => {
      const result = validatePassword('NoNumbers');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return multiple errors', () => {
      const result = validatePassword('abc');
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Password Confirmation', () => {
    const passwordsMatch = (password: string, confirmation: string): boolean => {
      return password === confirmation && password.length > 0;
    };

    it('should return true for matching passwords', () => {
      expect(passwordsMatch('SecurePass123', 'SecurePass123')).toBe(true);
    });

    it('should return false for non-matching passwords', () => {
      expect(passwordsMatch('Password1', 'Password2')).toBe(false);
    });

    it('should return false for empty passwords', () => {
      expect(passwordsMatch('', '')).toBe(false);
    });
  });

  describe('Project Name Validation', () => {
    interface ValidationResult {
      isValid: boolean;
      error?: string;
    }

    const validateProjectName = (name: string): ValidationResult => {
      const trimmed = name.trim();

      if (!trimmed) {
        return { isValid: false, error: 'Project name is required' };
      }

      if (trimmed.length < 2) {
        return { isValid: false, error: 'Project name must be at least 2 characters' };
      }

      if (trimmed.length > 50) {
        return { isValid: false, error: 'Project name must be less than 50 characters' };
      }

      return { isValid: true };
    };

    it('should accept valid project names', () => {
      expect(validateProjectName('My Project').isValid).toBe(true);
      expect(validateProjectName('Project 123').isValid).toBe(true);
      expect(validateProjectName('A'.repeat(50)).isValid).toBe(true);
    });

    it('should reject empty names', () => {
      expect(validateProjectName('').isValid).toBe(false);
      expect(validateProjectName('   ').isValid).toBe(false);
    });

    it('should reject too short names', () => {
      expect(validateProjectName('A').isValid).toBe(false);
    });

    it('should reject too long names', () => {
      expect(validateProjectName('A'.repeat(51)).isValid).toBe(false);
    });
  });

  describe('Slug Validation', () => {
    const validateSlug = (slug: string): { isValid: boolean; error?: string } => {
      if (!slug) {
        return { isValid: false, error: 'Slug is required' };
      }

      if (!/^[a-z0-9-]+$/.test(slug)) {
        return {
          isValid: false,
          error: 'Slug can only contain lowercase letters, numbers, and hyphens',
        };
      }

      if (slug.startsWith('-') || slug.endsWith('-')) {
        return { isValid: false, error: 'Slug cannot start or end with a hyphen' };
      }

      if (slug.includes('--')) {
        return { isValid: false, error: 'Slug cannot contain consecutive hyphens' };
      }

      if (slug.length > 50) {
        return { isValid: false, error: 'Slug must be less than 50 characters' };
      }

      return { isValid: true };
    };

    it('should accept valid slugs', () => {
      expect(validateSlug('my-project').isValid).toBe(true);
      expect(validateSlug('project123').isValid).toBe(true);
      expect(validateSlug('my-project-2').isValid).toBe(true);
    });

    it('should reject uppercase', () => {
      expect(validateSlug('MyProject').isValid).toBe(false);
    });

    it('should reject special characters', () => {
      expect(validateSlug('my_project').isValid).toBe(false);
      expect(validateSlug('my@project').isValid).toBe(false);
    });

    it('should reject leading/trailing hyphens', () => {
      expect(validateSlug('-my-project').isValid).toBe(false);
      expect(validateSlug('my-project-').isValid).toBe(false);
    });

    it('should reject consecutive hyphens', () => {
      expect(validateSlug('my--project').isValid).toBe(false);
    });
  });

  describe('Domain Validation', () => {
    const validateDomain = (domain: string): { isValid: boolean; error?: string } => {
      if (!domain) {
        return { isValid: false, error: 'Domain is required' };
      }

      // Allow wildcards for subdomains
      const domainPattern =
        /^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

      if (!domainPattern.test(domain)) {
        return { isValid: false, error: 'Invalid domain format' };
      }

      // Special case for localhost
      if (domain === 'localhost' || domain.startsWith('localhost:')) {
        return { isValid: true };
      }

      return { isValid: true };
    };

    it('should accept valid domains', () => {
      expect(validateDomain('example.com').isValid).toBe(true);
      expect(validateDomain('sub.example.com').isValid).toBe(true);
      expect(validateDomain('localhost').isValid).toBe(true);
    });

    it('should accept wildcard subdomains', () => {
      expect(validateDomain('*.example.com').isValid).toBe(true);
    });

    it('should reject invalid domains', () => {
      expect(validateDomain('').isValid).toBe(false);
      expect(validateDomain('-example.com').isValid).toBe(false);
    });
  });

  describe('Feedback Content Validation', () => {
    const validateFeedback = (content: string): { isValid: boolean; error?: string } => {
      const trimmed = content.trim();

      if (!trimmed) {
        return { isValid: false, error: 'Feedback cannot be empty' };
      }

      if (trimmed.length < 3) {
        return { isValid: false, error: 'Feedback must be at least 3 characters' };
      }

      if (trimmed.length > 5000) {
        return { isValid: false, error: 'Feedback must be less than 5000 characters' };
      }

      return { isValid: true };
    };

    it('should accept valid feedback', () => {
      expect(validateFeedback('This is great feedback!').isValid).toBe(true);
      expect(validateFeedback('OK!').isValid).toBe(true);
    });

    it('should reject empty feedback', () => {
      expect(validateFeedback('').isValid).toBe(false);
      expect(validateFeedback('   ').isValid).toBe(false);
    });

    it('should reject too short feedback', () => {
      expect(validateFeedback('Hi').isValid).toBe(false);
    });

    it('should reject too long feedback', () => {
      expect(validateFeedback('A'.repeat(5001)).isValid).toBe(false);
    });
  });

  describe('Rating Validation', () => {
    const validateRating = (rating: number): { isValid: boolean; error?: string } => {
      if (!Number.isInteger(rating)) {
        return { isValid: false, error: 'Rating must be a whole number' };
      }

      if (rating < 1 || rating > 5) {
        return { isValid: false, error: 'Rating must be between 1 and 5' };
      }

      return { isValid: true };
    };

    it('should accept valid ratings', () => {
      for (let i = 1; i <= 5; i++) {
        expect(validateRating(i).isValid).toBe(true);
      }
    });

    it('should reject ratings out of range', () => {
      expect(validateRating(0).isValid).toBe(false);
      expect(validateRating(6).isValid).toBe(false);
      expect(validateRating(-1).isValid).toBe(false);
    });

    it('should reject non-integer ratings', () => {
      expect(validateRating(3.5).isValid).toBe(false);
      expect(validateRating(2.1).isValid).toBe(false);
    });
  });

  describe('URL Validation', () => {
    const validateUrl = (url: string): { isValid: boolean; error?: string } => {
      if (!url) {
        return { isValid: true }; // URL is optional
      }

      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return { isValid: false, error: 'URL must use http or https' };
        }
        return { isValid: true };
      } catch {
        return { isValid: false, error: 'Invalid URL format' };
      }
    };

    it('should accept valid URLs', () => {
      expect(validateUrl('https://example.com').isValid).toBe(true);
      expect(validateUrl('http://localhost:3000').isValid).toBe(true);
      expect(validateUrl('https://example.com/path?query=1').isValid).toBe(true);
    });

    it('should accept empty URL (optional)', () => {
      expect(validateUrl('').isValid).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url').isValid).toBe(false);
      expect(validateUrl('ftp://example.com').isValid).toBe(false);
    });
  });

  describe('Form State Management', () => {
    interface FormState {
      values: Record<string, string>;
      errors: Record<string, string>;
      touched: Record<string, boolean>;
    }

    const getFieldError = (state: FormState, field: string): string | undefined => {
      if (!state.touched[field]) return undefined;
      return state.errors[field];
    };

    const isFormValid = (state: FormState): boolean => {
      return Object.keys(state.errors).length === 0;
    };

    const hasUnsavedChanges = (
      current: Record<string, string>,
      initial: Record<string, string>
    ): boolean => {
      return Object.keys(current).some((key) => current[key] !== initial[key]);
    };

    it('should only show error for touched fields', () => {
      const state: FormState = {
        values: { email: '' },
        errors: { email: 'Required' },
        touched: { email: false },
      };
      expect(getFieldError(state, 'email')).toBeUndefined();

      state.touched.email = true;
      expect(getFieldError(state, 'email')).toBe('Required');
    });

    it('should validate form completeness', () => {
      expect(isFormValid({ values: {}, errors: {}, touched: {} })).toBe(true);
      expect(isFormValid({ values: {}, errors: { email: 'Required' }, touched: {} })).toBe(false);
    });

    it('should detect unsaved changes', () => {
      const initial = { name: 'John', email: 'john@example.com' };
      const unchanged = { name: 'John', email: 'john@example.com' };
      const changed = { name: 'Jane', email: 'john@example.com' };

      expect(hasUnsavedChanges(unchanged, initial)).toBe(false);
      expect(hasUnsavedChanges(changed, initial)).toBe(true);
    });
  });
});
