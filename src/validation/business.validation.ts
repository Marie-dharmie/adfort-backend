import { z } from 'zod';

const businessBaseSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['RESTAURANT', 'CAR_DEALERSHIP', 'HOTEL', 'SALON', 'RETAIL', 'OTHER']),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  openingHours: z.record(z.string(), z.unknown()).optional()
});

export const businessCreateSchema = businessBaseSchema;

export const businessUpdateSchema = businessBaseSchema.partial();