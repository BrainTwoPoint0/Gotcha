import { z } from 'zod';

// Response modes
export const responseModeSchema = z.enum(['feedback', 'vote', 'poll']);

// Vote types
export const voteTypeSchema = z.enum(['up', 'down']);

// User metadata (flexible but bounded)
export const userSchema = z
  .object({
    id: z.string().optional(),
  })
  .catchall(z.unknown())
  .refine((obj) => JSON.stringify(obj).length <= 4096, {
    message: 'User metadata too large (max 4KB)',
  });

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
    elementId: z.string().min(1, 'elementId is required').max(200),
    mode: responseModeSchema,

    // Content fields
    content: z.string().max(10000).optional(),
    title: z.string().max(500).optional(),
    rating: z.number().int().min(1).max(10).optional(),
    vote: voteTypeSchema.optional(),

    // Poll specific
    pollOptions: z.array(z.string()).min(2).max(6).optional(),
    pollSelected: z.array(z.string()).optional(),

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

// Profile update schema
export const companySizeEnum = z.enum(['solo', '2-10', '11-50', '50+']);
export const roleEnum = z.enum(['founder', 'engineer', 'pm', 'designer', 'other']);
export const industryEnum = z.enum([
  'saas',
  'ecommerce',
  'education',
  'healthcare',
  'agency',
  'fintech',
  'analytics',
  'media',
  'devtools',
  'other',
]);
export const useCaseEnum = z.enum([
  'user-feedback',
  'feature-validation',
  'bug-reports',
  'nps',
  'polls',
  'other',
]);

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  companySize: companySizeEnum.optional(),
  role: roleEnum.optional(),
  industry: industryEnum.optional(),
  useCase: useCaseEnum.optional(),
  onboardedAt: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
