import type { Request, Response } from 'express';
import {
  analyzeCompetitorsForBusiness,
  createCompetitorForBusiness,
  deleteCompetitorForUser,
  listCompetitorsForBusiness
} from '../services/competitor.service';

export const listCompetitorsHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const competitors = await listCompetitorsForBusiness(businessId, req.user!.id);
  return res.json(competitors);
};

export const createCompetitorHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const competitor = await createCompetitorForBusiness(businessId, req.user!.id, req.body);

  if (!competitor) {
    return res.status(404).json({ message: 'Business not found' });
  }

  return res.status(201).json(competitor);
};

export const analyzeCompetitorsHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const analysis = await analyzeCompetitorsForBusiness(businessId, req.user!.id);

  if (!analysis) {
    return res.status(404).json({ message: 'Business not found' });
  }

  return res.json(analysis);
};

export const deleteCompetitorHandler = async (req: Request, res: Response) => {
  const competitorId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const competitor = await deleteCompetitorForUser(competitorId, req.user!.id);

  if (!competitor) {
    return res.status(404).json({ message: 'Competitor not found' });
  }

  return res.json({ message: 'Competitor deleted' });
};