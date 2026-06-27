import type { Request, Response } from 'express';
import {
  analyzeSeo,
  getBusinessForSeo,
  getKeywordSuggestions,
  getLocalListingChecklist,
  getSeoRecommendations
} from '../services/seo.service';

const getBusinessOr404 = async (businessId: string, userId: string, res: Response) => {
  const business = await getBusinessForSeo(businessId, userId);

  if (!business) {
    res.status(404).json({ message: 'Business not found' });
    return null;
  }

  return business;
};

export const getSeoKeywordsHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const business = await getBusinessOr404(businessId, req.user!.id, res);

  if (!business) {
    return;
  }

  return res.json(await getKeywordSuggestions(business));
};

export const getSeoRecommendationsHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const business = await getBusinessOr404(businessId, req.user!.id, res);

  if (!business) {
    return;
  }

  return res.json(await getSeoRecommendations(business));
};

export const getSeoChecklistHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const business = await getBusinessOr404(businessId, req.user!.id, res);

  if (!business) {
    return;
  }

  return res.json(await getLocalListingChecklist(business));
};

export const analyzeSeoHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const business = await getBusinessOr404(businessId, req.user!.id, res);

  if (!business) {
    return;
  }

  return res.json(await analyzeSeo(business));
};