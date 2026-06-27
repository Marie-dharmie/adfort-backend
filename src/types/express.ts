import type { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      files?: {
        [fieldname: string]: globalThis.Express.Multer.File[];
      } | globalThis.Express.Multer.File[];
    }
  }
}

export {};