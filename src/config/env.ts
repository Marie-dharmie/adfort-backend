import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default('mysql://root:adfort-db-2026@mysql.railway.internal:3306/adfort'),
  JWT_SECRET: z.string().min(1).default('adfort-jwt-secret-prod-2026'),
  JWT_REFRESH_SECRET: z.string().min(1).default('adfort-refresh-secret-prod-2026'),
  OPENAI_API_KEY: z.string().optional().default(''),
  RESEND_API_KEY: z.string().optional().default(''),
  FROM_EMAIL: z.string().email().default('noreply@adfort.com'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  UPLOAD_DIR: z.string().default('./uploads')
});

export const env = envSchema.parse(process.env);