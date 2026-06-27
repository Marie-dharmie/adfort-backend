import type { Request, Response } from 'express';
import {
  getAnalyticsOverview,
  getBusinessForUserAccess,
  getCampaignPerformance,
  getCustomerEngagementSummary,
  getReviewsTrend,
  getVisibilityTrend,
  upsertAnalyticsForBusiness
} from '../services/analytics.service';
import { prisma } from '../config/database';

const parseDate = (value: unknown) => {
  if (typeof value !== 'string' || !value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getBusinessId = (req: Request) => (Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId);

const ensureBusinessAccess = async (req: Request, res: Response) => {
  const businessId = getBusinessId(req);
  const business = await getBusinessForUserAccess(businessId, req.user!.id);

  if (!business) {
    res.status(404).json({ message: 'Business not found' });
    return null;
  }

  return businessId;
};

const getRange = (req: Request) => ({
  startDate: parseDate(req.query.startDate),
  endDate: parseDate(req.query.endDate)
});

export const getAnalyticsOverviewHandler = async (req: Request, res: Response) => {
  const businessId = await ensureBusinessAccess(req, res);

  if (!businessId) {
    return;
  }

  const result = await getAnalyticsOverview(businessId, getRange(req));
  return res.json(result);
};

export const getVisibilityTrendHandler = async (req: Request, res: Response) => {
  const businessId = await ensureBusinessAccess(req, res);

  if (!businessId) {
    return;
  }

  const result = await getVisibilityTrend(businessId, getRange(req));
  return res.json(result);
};

export const getReviewsTrendHandler = async (req: Request, res: Response) => {
  const businessId = await ensureBusinessAccess(req, res);

  if (!businessId) {
    return;
  }

  const result = await getReviewsTrend(businessId, getRange(req));
  return res.json(result);
};

export const getCampaignPerformanceHandler = async (req: Request, res: Response) => {
  const businessId = await ensureBusinessAccess(req, res);

  if (!businessId) {
    return;
  }

  const result = await getCampaignPerformance(businessId, getRange(req));
  return res.json(result);
};

export const getEngagementHandler = async (req: Request, res: Response) => {
  const businessId = await ensureBusinessAccess(req, res);

  if (!businessId) {
    return;
  }

  const result = await getCustomerEngagementSummary(businessId, getRange(req));
  return res.json(result);
};

export const ingestAnalyticsHandler = async (req: Request, res: Response) => {
  const businessId = getBusinessId(req);

  // Verify the business belongs to the user, unless the user is ADMIN.
  if (req.user!.role !== 'ADMIN') {
    const business = await getBusinessForUserAccess(businessId, req.user!.id);

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
  } else {
    // Admins still need a real business to attach analytics to.
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true }
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
  }

  const parsedDate = parseDate(req.body.date);

  if (!parsedDate) {
    return res.status(400).json({ message: 'A valid date is required' });
  }

  const analytics = await upsertAnalyticsForBusiness(businessId, {
    date: parsedDate,
    impressions: typeof req.body.impressions === 'number' ? req.body.impressions : undefined,
    clicks: typeof req.body.clicks === 'number' ? req.body.clicks : undefined,
    conversions: typeof req.body.conversions === 'number' ? req.body.conversions : undefined,
    costPerConversion: typeof req.body.costPerConversion === 'number' ? req.body.costPerConversion : undefined,
    websiteTraffic: typeof req.body.websiteTraffic === 'number' ? req.body.websiteTraffic : undefined,
    reviewCount: typeof req.body.reviewCount === 'number' ? req.body.reviewCount : undefined,
    avgRating: typeof req.body.avgRating === 'number' ? req.body.avgRating : undefined
  });

  return res.status(201).json(analytics);
};