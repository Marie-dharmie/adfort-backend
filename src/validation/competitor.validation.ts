import { z } from 'zod';

export const competitorCreateSchema = z.object({
  competitorName: z.string().min(1),
  reviewCount: z.number().int().min(0),
  avgRating: z.number().min(0).max(5),
  socialFollowers: z.number().int().min(0),
  visibilityScore: z.number().int().min(0).max(100)
});