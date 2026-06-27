import { z } from 'zod';

export const reviewCreateSchema = z.object({
  reviewerName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  source: z.string().optional()
});

export const reviewRequestTemplateSchema = z.object({
  channel: z.enum(['email', 'sms']).optional()
});