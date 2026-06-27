import type { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export const listCompetitorsForBusiness = (businessId: string, userId: string) =>
  prisma.competitorData.findMany({
    where: {
      businessId,
      business: {
        userId
      }
    },
    orderBy: { lastUpdated: 'desc' }
  });

export const createCompetitorForBusiness = async (
  businessId: string,
  userId: string,
  data: Pick<
    Prisma.CompetitorDataUncheckedCreateInput,
    'competitorName' | 'reviewCount' | 'avgRating' | 'socialFollowers' | 'visibilityScore'
  >
) => {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId },
    select: { id: true }
  });

  if (!business) {
    return null;
  }

  return prisma.competitorData.create({
    data: {
      businessId,
      competitorName: data.competitorName,
      reviewCount: data.reviewCount,
      avgRating: data.avgRating,
      socialFollowers: data.socialFollowers,
      visibilityScore: data.visibilityScore,
      lastUpdated: new Date()
    }
  });
};

export const deleteCompetitorForUser = async (competitorId: string, userId: string) => {
  const competitor = await prisma.competitorData.findFirst({
    where: {
      id: competitorId,
      business: {
        userId
      }
    }
  });

  if (!competitor) {
    return null;
  }

  await prisma.competitorData.delete({
    where: { id: competitorId }
  });

  return competitor;
};

export const analyzeCompetitorsForBusiness = async (businessId: string, userId: string) => {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId },
    include: {
      reviews: true,
      competitors: true
    }
  });

  if (!business) {
    return null;
  }

  const ownReviewCount = business.reviews.length;
  const ownAvgRating = ownReviewCount
    ? Number((business.reviews.reduce((sum, review) => sum + review.rating, 0) / ownReviewCount).toFixed(2))
    : 0;

  const competitorAverages = business.competitors.length
    ? {
        reviewCount: Number(
          (
            business.competitors.reduce((sum, competitor) => sum + competitor.reviewCount, 0) /
            business.competitors.length
          ).toFixed(2)
        ),
        avgRating: Number(
          (
            business.competitors.reduce((sum, competitor) => sum + competitor.avgRating, 0) /
            business.competitors.length
          ).toFixed(2)
        ),
        socialFollowers: Number(
          (
            business.competitors.reduce((sum, competitor) => sum + competitor.socialFollowers, 0) /
            business.competitors.length
          ).toFixed(2)
        ),
        visibilityScore: Number(
          (
            business.competitors.reduce((sum, competitor) => sum + competitor.visibilityScore, 0) /
            business.competitors.length
          ).toFixed(2)
        )
      }
    : {
        reviewCount: 0,
        avgRating: 0,
        socialFollowers: 0,
        visibilityScore: 0
      };

  const gaps = {
    reviews: competitorAverages.reviewCount - ownReviewCount,
    rating: Number((competitorAverages.avgRating - ownAvgRating).toFixed(2)),
    visibility: Number((competitorAverages.visibilityScore - business.visibilityScore).toFixed(2))
  };

  const recommendations = [
    gaps.reviews > 0 ? 'Increase review acquisition campaigns to close the review volume gap.' : 'Maintain your review momentum and keep requesting feedback consistently.',
    gaps.rating > 0 ? 'Focus on service recovery and response quality to improve average rating.' : 'Promote your strong rating in local marketing assets.',
    gaps.visibility > 0 ? 'Invest in local SEO and profile completeness to improve visibility score.' : 'Protect your visibility lead with regular profile updates and fresh content.'
  ];

  return {
    businessId,
    businessMetrics: {
      reviewCount: ownReviewCount,
      avgRating: ownAvgRating,
      visibilityScore: business.visibilityScore
    },
    competitorAverages,
    competitors: business.competitors,
    gaps,
    recommendations
  };
};