/**
 * Unit tests for response edit/update functionality
 * Tests the check and update API logic
 */

import { z } from 'zod';

// Schema matching the update endpoint validation
const updateResponseSchema = z.object({
  content: z.string().max(10000).optional(),
  title: z.string().max(500).optional(),
  rating: z.number().min(1).max(5).optional(),
  vote: z.enum(['up', 'down']).optional(),
  pollSelected: z.array(z.string()).optional(),
});

describe('Response Edit API Logic', () => {
  describe('Update Response Validation', () => {
    it('should accept content update', () => {
      const result = updateResponseSchema.safeParse({
        content: 'Updated feedback content',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Updated feedback content');
      }
    });

    it('should accept rating update', () => {
      const result = updateResponseSchema.safeParse({
        rating: 4,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe(4);
      }
    });

    it('should accept vote update', () => {
      const result = updateResponseSchema.safeParse({
        vote: 'up',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vote).toBe('up');
      }
    });

    it('should accept poll selection update', () => {
      const result = updateResponseSchema.safeParse({
        pollSelected: ['Option A', 'Option B'],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pollSelected).toEqual(['Option A', 'Option B']);
      }
    });

    it('should accept multiple field updates', () => {
      const result = updateResponseSchema.safeParse({
        content: 'New content',
        rating: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('New content');
        expect(result.data.rating).toBe(5);
      }
    });

    it('should accept empty update (no-op)', () => {
      const result = updateResponseSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject invalid rating (too low)', () => {
      const result = updateResponseSchema.safeParse({
        rating: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid rating (too high)', () => {
      const result = updateResponseSchema.safeParse({
        rating: 6,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid vote value', () => {
      const result = updateResponseSchema.safeParse({
        vote: 'maybe',
      });
      expect(result.success).toBe(false);
    });

    it('should reject content exceeding max length', () => {
      const result = updateResponseSchema.safeParse({
        content: 'x'.repeat(10001),
      });
      expect(result.success).toBe(false);
    });

    it('should reject title exceeding max length', () => {
      const result = updateResponseSchema.safeParse({
        title: 'x'.repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Existing Response Check Logic', () => {
    // Simulates the check logic from the API
    interface Response {
      id: string;
      projectId: string;
      elementIdRaw: string;
      endUserId: string | null;
    }

    const findExistingResponse = (
      responses: Response[],
      projectId: string,
      elementId: string,
      userId: string
    ): Response | null => {
      return (
        responses.find(
          (r) => r.projectId === projectId && r.elementIdRaw === elementId && r.endUserId === userId
        ) || null
      );
    };

    const mockResponses: Response[] = [
      {
        id: 'resp-1',
        projectId: 'proj-1',
        elementIdRaw: 'feature-card',
        endUserId: 'user-123',
      },
      {
        id: 'resp-2',
        projectId: 'proj-1',
        elementIdRaw: 'feature-card',
        endUserId: 'user-456',
      },
      {
        id: 'resp-3',
        projectId: 'proj-1',
        elementIdRaw: 'other-element',
        endUserId: 'user-123',
      },
      {
        id: 'resp-4',
        projectId: 'proj-2',
        elementIdRaw: 'feature-card',
        endUserId: 'user-123',
      },
    ];

    it('should find existing response for user+element combination', () => {
      const result = findExistingResponse(mockResponses, 'proj-1', 'feature-card', 'user-123');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('resp-1');
    });

    it('should return null for new user+element combination', () => {
      const result = findExistingResponse(mockResponses, 'proj-1', 'feature-card', 'user-789');
      expect(result).toBeNull();
    });

    it('should differentiate by element', () => {
      const result = findExistingResponse(mockResponses, 'proj-1', 'other-element', 'user-123');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('resp-3');
    });

    it('should differentiate by project', () => {
      const result = findExistingResponse(mockResponses, 'proj-2', 'feature-card', 'user-123');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('resp-4');
    });

    it('should return null for non-existent project', () => {
      const result = findExistingResponse(mockResponses, 'proj-999', 'feature-card', 'user-123');
      expect(result).toBeNull();
    });
  });

  describe('User Ownership Validation', () => {
    // Simulates ownership check from the API
    const validateOwnership = (responseUserId: string | null, requestUserId: string): boolean => {
      if (!responseUserId) return false;
      return responseUserId === requestUserId;
    };

    it('should allow update when user IDs match', () => {
      expect(validateOwnership('user-123', 'user-123')).toBe(true);
    });

    it('should deny update when user IDs differ', () => {
      expect(validateOwnership('user-123', 'user-456')).toBe(false);
    });

    it('should deny update when response has no user ID', () => {
      expect(validateOwnership(null, 'user-123')).toBe(false);
    });
  });
});
