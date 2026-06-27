import { z } from 'zod';

export const analyticsIngestSchema = z.object({
  date: z.string().min(1),
  impressions: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
  costPerConversion: z.number().min(0).optional(),
  websiteTraffic: z.number().int().min(0).optional(),
  reviewCount: z.number().int().min(0).optional(),
  avgRating: z.number().min(0).max(5).optional()
});
