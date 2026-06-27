import type { Request, Response } from 'express';
import {
  generateDailySpecialCampaign,
  generateEventPromotion,
  generateFoodMarketingContent,
  generateLoyaltyCampaignSuggestions,
  generateMenuPromotion
} from '../services/restaurant.service';
import {
  generateFinancingCampaign,
  generateLeadGenerationCampaign,
  generateNewArrivalAnnouncement,
  generateVehiclePromotion,
  optimizeVehicleListing
} from '../services/dealership.service';

export const postRestaurantMenuPromo = async (req: Request, res: Response) => {
  const content = await generateMenuPromotion(req.body);
  return res.json(content);
};

export const postRestaurantDailySpecial = async (req: Request, res: Response) => {
  const content = await generateDailySpecialCampaign(req.body);
  return res.json(content);
};

export const postRestaurantEventPromo = async (req: Request, res: Response) => {
  const content = await generateEventPromotion(req.body);
  return res.json(content);
};

export const postRestaurantLoyaltyCampaign = async (req: Request, res: Response) => {
  const content = await generateLoyaltyCampaignSuggestions(req.body);
  return res.json(content);
};

export const postRestaurantFoodContent = async (req: Request, res: Response) => {
  const content = await generateFoodMarketingContent(req.body);
  return res.json(content);
};

export const postDealershipVehiclePromo = async (req: Request, res: Response) => {
  const content = await generateVehiclePromotion(req.body);
  return res.json(content);
};

export const postDealershipFinancingCampaign = async (req: Request, res: Response) => {
  const content = await generateFinancingCampaign(req.body);
  return res.json(content);
};

export const postDealershipNewArrival = async (req: Request, res: Response) => {
  const content = await generateNewArrivalAnnouncement(req.body);
  return res.json(content);
};

export const postDealershipLeadGen = async (req: Request, res: Response) => {
  const content = await generateLeadGenerationCampaign(req.body);
  return res.json(content);
};

export const postDealershipListingOptimize = async (req: Request, res: Response) => {
  const content = await optimizeVehicleListing(req.body);
  return res.json(content);
};