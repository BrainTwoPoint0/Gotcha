import { z } from 'zod';

// Response modes
export const responseModeSchema = z.enum(['feedback', 'vote', 'poll', 'feature-request', 'ab']);

// Vote types
export const voteTypeSchema = z.enum(['up', 'down']);

// User metadata (flexible)
export const userSchema = z
  .object({
    id: z.string().optional(),
  })
  .passthrough(); // Allow any additional properties

// Context
export const contextSchema = z
  .object({
    url: z.string().url().optional(),
    userAgent: z.string().optional(),
  })
  .optional();

// Submit response payload
export const submitResponseSchema = z
  .object({
    elementId: z.string().min(1, 'elementId is required'),
    mode: responseModeSchema,

    // Content fields
    content: z.string().optional(),
    title: z.string().optional(),
    rating: z.number().int().min(1).max(10).optional(),
    vote: voteTypeSchema.optional(),

    // Poll specific
    pollOptions: z.array(z.string()).min(2).max(6).optional(),
    pollSelected: z.array(z.string()).optional(),

    // A/B specific
    experimentId: z.string().optional(),
    variant: z.string().optional(),

    // User data
    user: userSchema.optional(),

    // Context
    context: contextSchema,
  })
  .refine(
    (data) => {
      // Vote mode requires vote field
      if (data.mode === 'vote' && !data.vote) {
        return false;
      }
      return true;
    },
    { message: 'Vote mode requires a vote (up or down)' }
  )
  .refine(
    (data) => {
      // Poll mode requires pollOptions and pollSelected
      if (data.mode === 'poll') {
        if (!data.pollOptions || data.pollOptions.length < 2) {
          return false;
        }
        if (!data.pollSelected || data.pollSelected.length === 0) {
          return false;
        }
      }
      return true;
    },
    { message: 'Poll mode requires pollOptions (2-6) and pollSelected' }
  )
  .refine(
    (data) => {
      // A/B mode requires experimentId
      if (data.mode === 'ab' && !data.experimentId) {
        return false;
      }
      return true;
    },
    { message: 'A/B mode requires experimentId' }
  );

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

// List responses query params
export const listResponsesSchema = z.object({
  elementId: z.string().optional(),
  mode: responseModeSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListResponsesInput = z.infer<typeof listResponsesSchema>;
