import type { Request, Response } from 'express';
import { ReviewSentiment } from '@prisma/client';
import {
  buildReviewRequestTemplate,
  createReviewForBusiness,
  getReviewById,
  getReviewStatsForBusiness,
  listReviewsForBusiness,
  updateReviewAiResponse
} from '../services/review.service';
import { generateReviewResponse } from '../services/review-ai.service';
import { generateReviewQrCode } from '../services/qrcode.service';
import { prisma } from '../config/database';

const parseDate = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const listReviewsHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId: req.user!.id },
    select: { id: true }
  });

  if (!business) {
    return res.status(404).json({ message: 'Business not found' });
  }

  const sentimentParam = Array.isArray(req.query.sentiment) ? req.query.sentiment[0] : req.query.sentiment;
  const sentiment =
    typeof sentimentParam === 'string' &&
    Object.values(ReviewSentiment).includes(sentimentParam as ReviewSentiment)
      ? (sentimentParam as ReviewSentiment)
      : undefined;

  const result = await listReviewsForBusiness(businessId, {
    rating: req.query.rating ? Number(req.query.rating) : undefined,
    sentiment,
    startDate: parseDate(typeof req.query.startDate === 'string' ? req.query.startDate : undefined),
    endDate: parseDate(typeof req.query.endDate === 'string' ? req.query.endDate : undefined),
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined
  });

  return res.json(result);
};

export const createReviewHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true }
  });

  if (!business) {
    return res.status(404).json({ message: 'Business not found' });
  }

  const review = await createReviewForBusiness(businessId, req.body);
  return res.status(201).json(review);
};

export const generateReviewAiResponseHandler = async (req: Request, res: Response) => {
  const reviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const review = await getReviewById(reviewId);

  if (!review || review.business.userId !== req.user!.id) {
    return res.status(404).json({ message: 'Review not found' });
  }

  const aiResponse = await generateReviewResponse(review);
  const updatedReview = await updateReviewAiResponse(reviewId, aiResponse);

  return res.json(updatedReview);
};

export const getReviewStatsHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId: req.user!.id },
    select: { id: true }
  });

  if (!business) {
    return res.status(404).json({ message: 'Business not found' });
  }

  const stats = await getReviewStatsForBusiness(businessId);
  return res.json(stats);
};

export const getReviewQrCodeHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId: req.user!.id },
    select: { id: true }
  });

  if (!business) {
    return res.status(404).json({ message: 'Business not found' });
  }

  const baseUrl = typeof req.query.baseUrl === 'string' ? req.query.baseUrl : undefined;
  const qrCode = await generateReviewQrCode(businessId, baseUrl);
  return res.json(qrCode);
};

export const getReviewRequestTemplateHandler = async (req: Request, res: Response) => {
  const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId: req.user!.id },
    select: { id: true }
  });

  if (!business) {
    return res.status(404).json({ message: 'Business not found' });
  }

  const channelParam = Array.isArray(req.body.channel) ? req.body.channel[0] : req.body.channel;
  const channel = channelParam === 'sms' ? 'sms' : 'email';
  const template = await buildReviewRequestTemplate(businessId, channel);

  return res.json(template);
};