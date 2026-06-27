import type { Request, Response } from 'express';
import {
  calculateAndStoreVisibilityScore,
  getCurrentVisibilityScoreForUser,
  getVisibilityHistoryForUser
} from '../services/visibility.service';

export const getVisibilityScoreHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const result = await getCurrentVisibilityScoreForUser(businessId, req.user!.id);

  if (!result) {
    return res.status(404).json({ message: 'Business not found' });
  }

  return res.json(result);
};

export const calculateVisibilityScoreHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const current = await getCurrentVisibilityScoreForUser(businessId, req.user!.id);

  if (!current) {
    return res.status(404).json({ message: 'Business not found' });
  }

  const result = await calculateAndStoreVisibilityScore(businessId);
  return res.status(201).json(result);
};

export const getVisibilityHistoryHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const history = await getVisibilityHistoryForUser(businessId, req.user!.id);

  if (!history) {
    return res.status(404).json({ message: 'Business not found' });
  }

  return res.json({
    businessId,
    history
  });
};