import { z } from 'zod';

const generatedContentTypeSchema = z.enum([
  'FACEBOOK_POST',
  'INSTAGRAM_CAPTION',
  'PROMO_CAMPAIGN',
  'GOOGLE_UPDATE',
  'MARKETING_EMAIL',
  'AD_COPY',
  'PRODUCT_DESCRIPTION',
  'MENU_PROMO',
  'VEHICLE_PROMO'
]);

const generatedContentStatusSchema = z.enum(['DRAFT', 'SAVED', 'EXPORTED']);

export const aiChatSchema = z.object({
  businessId: z.string().min(1),
  message: z.string().min(1),
  conversationId: z.string().min(1).optional()
});

export const generateContentSchema = z.object({
  businessId: z.string().min(1),
  contentType: generatedContentTypeSchema,
  additionalInstructions: z.string().optional(),
  save: z.boolean().optional(),
  status: generatedContentStatusSchema.optional()
});

export const updateGeneratedContentSchema = z
  .object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    status: generatedContentStatusSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  });
