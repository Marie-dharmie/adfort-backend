import { ReviewSentiment, type Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { calculateAndStoreVisibilityScore } from './visibility.service';

const positiveWords = [
  'great',
  'excellent',
  'amazing',
  'friendly',
  'helpful',
  'fast',
  'love',
  'awesome',
  'perfect',
  'recommend',
  'clean',
  'professional',
  'best',
  'fantastic',
  'wonderful'
];

const negativeWords = [
  'bad',
  'terrible',
  'awful',
  'slow',
  'rude',
  'poor',
  'hate',
  'worst',
  'dirty',
  'disappointed',
  'problem',
  'issue',
  'unprofessional',
  'late',
  'expensive'
];

export type ReviewFilters = {
  rating?: number;
  sentiment?: ReviewSentiment;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
};

const clampSentimentScore = (value: number) => Math.max(-1, Math.min(1, Number(value.toFixed(2))));

export const analyzeSentiment = (comment?: string | null) => {
  const normalized = comment?.toLowerCase().trim() ?? '';

  if (!normalized) {
    return {
      sentiment: ReviewSentiment.NEUTRAL,
      sentimentScore: 0
    };
  }

  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const rawScore = tokens.reduce((score, token) => {
    if (positiveWords.includes(token)) {
      return score + 1;
    }

    if (negativeWords.includes(token)) {
      return score - 1;
    }

    return score;
  }, 0);

  const normalizedScore = clampSentimentScore(tokens.length ? rawScore / tokens.length : 0);

  if (normalizedScore > 0.05) {
    return {
      sentiment: ReviewSentiment.POSITIVE,
      sentimentScore: normalizedScore
    };
  }

  if (normalizedScore < -0.05) {
    return {
      sentiment: ReviewSentiment.NEGATIVE,
      sentimentScore: normalizedScore
    };
  }

  return {
    sentiment: ReviewSentiment.NEUTRAL,
    sentimentScore: normalizedScore
  };
};

export const listReviewsForBusiness = async (businessId: string, filters: ReviewFilters) => {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.max(1, Math.min(100, filters.limit ?? 20));

  const where: Prisma.ReviewWhereInput = {
    businessId,
    ...(typeof filters.rating === 'number' ? { rating: filters.rating } : {}),
    ...(filters.sentiment ? { sentiment: filters.sentiment } : {}),
    ...((filters.startDate || filters.endDate)
      ? {
          createdAt: {
            ...(filters.startDate ? { gte: filters.startDate } : {}),
            ...(filters.endDate ? { lte: filters.endDate } : {})
          }
        }
      : {})
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.review.count({ where })
  ]);

  return {
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
};

export const createReviewForBusiness = async (
  businessId: string,
  data: Pick<Prisma.ReviewUncheckedCreateInput, 'reviewerName' | 'rating' | 'comment' | 'source'>
) => {
  const sentiment = analyzeSentiment(data.comment);

  const review = await prisma.review.create({
    data: {
      businessId,
      reviewerName: data.reviewerName,
      rating: data.rating,
      comment: data.comment,
      source: data.source,
      sentiment: sentiment.sentiment,
      sentimentScore: sentiment.sentimentScore
    }
  });

  await calculateAndStoreVisibilityScore(businessId);
  return review;
};

export const updateReviewAiResponse = async (reviewId: string, aiResponse: string) => {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { aiResponse }
  });

  await calculateAndStoreVisibilityScore(review.businessId);
  return review;
};

export const getReviewById = (reviewId: string) =>
  prisma.review.findUnique({
    where: { id: reviewId },
    include: { business: true }
  });

export const getReviewStatsForBusiness = async (businessId: string) => {
  const reviews = await prisma.review.findMany({
    where: { businessId }
  });

  const totalCount = reviews.length;
  const avgRating = totalCount
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / totalCount).toFixed(2))
    : 0;

  const sentimentDistribution = reviews.reduce(
    (distribution, review) => {
      distribution[review.sentiment] += 1;
      return distribution;
    },
    {
      POSITIVE: 0,
      NEUTRAL: 0,
      NEGATIVE: 0
    } as Record<ReviewSentiment, number>
  );

  return {
    businessId,
    avgRating,
    totalCount,
    sentimentDistribution
  };
};

export const buildReviewRequestTemplate = async (businessId: string, channel: 'email' | 'sms' = 'email') => {
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  });

  if (!business) {
    return null;
  }

  const reviewUrl = `/review/${businessId}`;

  if (channel === 'sms') {
    return {
      channel,
      subject: null,
      message: `Hi from ${business.name}! We'd love your feedback. Please share your experience here: ${reviewUrl}`
    };
  }

  return {
    channel,
    subject: `How was your experience with ${business.name}?`,
    message: `Hi,\n\nThank you for choosing ${business.name}. We'd appreciate a quick review to help other local customers find us.\n\nLeave your feedback here: ${reviewUrl}\n\nThank you,\n${business.name}`
  };
};