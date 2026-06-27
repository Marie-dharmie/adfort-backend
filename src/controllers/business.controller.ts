import type { Request, Response } from 'express';
import { createBusiness, getBusinessForUser, listBusinessesForUser, updateBusinessForUser } from '../services/business.service';

const normalizeImages = (files: Express.Request['files']) => {
  if (!files || Array.isArray(files)) {
    return [];
  }

  return (files.images ?? []).map((file) => file.filename);
};

export const createBusinessHandler = async (req: Request, res: Response) => {
  const logoFile = !Array.isArray(req.files) ? req.files?.logo?.[0] : undefined;
  const imageFiles = normalizeImages(req.files);

  const business = await createBusiness({
    ...req.body,
    socialLinks: req.body.socialLinks ?? {},
    openingHours: req.body.openingHours ?? {},
    images: imageFiles,
    logo: logoFile?.filename,
    userId: req.user!.id
  });

  return res.status(201).json(business);
};

export const listBusinessesHandler = async (req: Request, res: Response) => {
  const businesses = await listBusinessesForUser(req.user!.id);
  return res.json(businesses);
};

export const getBusinessHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const business = await getBusinessForUser(businessId, req.user!.id);

  if (!business) {
    return res.status(404).json({ message: 'Business not found' });
  }

  return res.json(business);
};

export const updateBusinessHandler = async (req: Request, res: Response) => {
  const logoFile = !Array.isArray(req.files) ? req.files?.logo?.[0] : undefined;
  const imageFiles = normalizeImages(req.files);
  const businessId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const result = await updateBusinessForUser(businessId, req.user!.id, {
    ...req.body,
    ...(logoFile ? { logo: logoFile.filename } : {}),
    ...(imageFiles.length ? { images: imageFiles } : {})
  });

  if (result.count === 0) {
    return res.status(404).json({ message: 'Business not found' });
  }

  return res.json({ message: 'Business updated' });
};