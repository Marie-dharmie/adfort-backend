import type { Business, Prisma, Review, ReviewSentiment, VisibilityScore } from '@prisma/client';
import { prisma } from '../config/database';

type BusinessWithReviews = Business & {
  reviews: Review[];
};

type ScoreBreakdown = {
  overallScore: number;
  googlePresence: number;
  websiteQuality: number;
  socialMediaActivity: number;
  reviewsReputation: number;
  localSeo: number;
  profileCompleteness: number;
  calculatedAt: Date;
  details: {
    googlePresence: Record<string, number | boolean>;
    websiteQuality: Record<string, number | boolean | string>;
    socialMediaActivity: Record<string, number>;
    reviewsReputation: Record<string, number>;
    localSeo: Record<string, number | boolean>;
    profileCompleteness: Record<string, number | string[]>;
  };
};

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const normalizeObjectValues = (value: Prisma.JsonValue | null | undefined) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.values(value).filter((entry) => {
    if (typeof entry === 'string') {
      return entry.trim().length > 0;
    }

    if (Array.isArray(entry)) {
      return entry.length > 0;
    }

    return Boolean(entry);
  });
};

const getSocialLinks = (business: Business) => normalizeObjectValues(business.socialLinks);

const getImages = (business: Business) => {
  if (!Array.isArray(business.images)) {
    return [];
  }

  return business.images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0);
};

const calculateGooglePresence = (business: Business) => {
  const hasListingInfo = Boolean(business.name && business.address && business.phone);
  const postFrequencyScore = business.description ? 75 : 45;
  const photoScore = Math.min(100, getImages(business).length * 20 + (business.logo ? 20 : 0));
  const score = clampScore((hasListingInfo ? 45 : 15) + postFrequencyScore * 0.3 + photoScore * 0.25);

  return {
    score,
    details: {
      hasListingInfo,
      postFrequencyScore,
      photoScore
    }
  };
};

const calculateWebsiteQuality = (business: Business) => {
  const hasWebsite = Boolean(business.website);
  const hasSsl = business.website?.startsWith('https://') ?? false;
  const mobileFriendly = hasWebsite ? Boolean(business.description || business.logo || getImages(business).length) : false;
  const score = clampScore((hasWebsite ? 40 : 0) + (hasSsl ? 30 : 0) + (mobileFriendly ? 30 : 10));

  return {
    score,
    details: {
      hasWebsite,
      hasSsl,
      mobileFriendly,
      websiteUrl: business.website ?? ''
    }
  };
};

const calculateSocialMediaActivity = (business: Business) => {
  const socialLinks = getSocialLinks(business);
  const socialCountScore = Math.min(60, socialLinks.length * 20);
  const engagementScore = Math.min(40, socialLinks.length * 10 + (business.description ? 10 : 0));
  const score = clampScore(socialCountScore + engagementScore);

  return {
    score,
    details: {
      socialLinksCount: socialLinks.length,
      socialCountScore,
      engagementScore
    }
  };
};

const calculateReviewsReputation = (reviews: Review[]) => {
  if (reviews.length === 0) {
    return {
      score: 20,
      details: {
        averageRating: 0,
        reviewCount: 0,
        responseRate: 0,
        sentimentScore: 0
      }
    };
  }

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const reviewCountScore = Math.min(25, reviews.length * 4);
  const ratingScore = (averageRating / 5) * 40;
  const responseRate = reviews.filter((review) => Boolean(review.aiResponse)).length / reviews.length;
  const responseRateScore = responseRate * 20;
  const sentimentWeights: Record<ReviewSentiment, number> = {
    POSITIVE: 1,
    NEUTRAL: 0.5,
    NEGATIVE: 0
  };
  const sentimentAverage =
    reviews.reduce((sum, review) => sum + sentimentWeights[review.sentiment], 0) / reviews.length;
  const sentimentScore = sentimentAverage * 15;
  const score = clampScore(ratingScore + reviewCountScore + responseRateScore + sentimentScore);

  return {
    score,
    details: {
      averageRating: Number(averageRating.toFixed(2)),
      reviewCount: reviews.length,
      responseRate: Number((responseRate * 100).toFixed(2)),
      sentimentScore: Number((sentimentAverage * 100).toFixed(2))
    }
  };
};

const calculateLocalSeo = (business: Business) => {
  const napConsistency = Boolean(business.name && business.address && business.phone);
  const keywordOptimization = business.description
    ? Number(/pizza|restaurant|hotel|salon|retail|dealership/i.test(business.description))
    : 0;
  const categoryAccuracy = business.category !== 'OTHER';
  const score = clampScore((napConsistency ? 45 : 15) + (keywordOptimization ? 30 : 10) + (categoryAccuracy ? 25 : 10));

  return {
    score,
    details: {
      napConsistency,
      keywordOptimization,
      categoryAccuracy
    }
  };
};

const calculateProfileCompleteness = (business: Business) => {
  const completedFields: string[] = [];
  const fieldChecks = [
    ['name', Boolean(business.name)],
    ['description', Boolean(business.description)],
    ['address', Boolean(business.address)],
    ['phone', Boolean(business.phone)],
    ['email', Boolean(business.email)],
    ['website', Boolean(business.website)],
    ['hours', normalizeObjectValues(business.openingHours).length > 0],
    ['logo', Boolean(business.logo)],
    ['images', getImages(business).length > 0],
    ['socialLinks', getSocialLinks(business).length > 0]
  ] as const;

  for (const [field, isComplete] of fieldChecks) {
    if (isComplete) {
      completedFields.push(field);
    }
  }

  const score = clampScore((completedFields.length / fieldChecks.length) * 100);

  return {
    score,
    details: {
      completedFields,
      completedCount: completedFields.length,
      totalFields: fieldChecks.length
    }
  };
};

export const calculateVisibilityScore = (business: BusinessWithReviews): ScoreBreakdown => {
  const googlePresence = calculateGooglePresence(business);
  const websiteQuality = calculateWebsiteQuality(business);
  const socialMediaActivity = calculateSocialMediaActivity(business);
  const reviewsReputation = calculateReviewsReputation(business.reviews);
  const localSeo = calculateLocalSeo(business);
  const profileCompleteness = calculateProfileCompleteness(business);

  const overallScore = clampScore(
    googlePresence.score * 0.2 +
      websiteQuality.score * 0.15 +
      socialMediaActivity.score * 0.15 +
      reviewsReputation.score * 0.25 +
      localSeo.score * 0.1 +
      profileCompleteness.score * 0.15
  );

  return {
    overallScore,
    googlePresence: googlePresence.score,
    websiteQuality: websiteQuality.score,
    socialMediaActivity: socialMediaActivity.score,
    reviewsReputation: reviewsReputation.score,
    localSeo: localSeo.score,
    profileCompleteness: profileCompleteness.score,
    calculatedAt: new Date(),
    details: {
      googlePresence: googlePresence.details,
      websiteQuality: websiteQuality.details,
      socialMediaActivity: socialMediaActivity.details,
      reviewsReputation: reviewsReputation.details,
      localSeo: localSeo.details,
      profileCompleteness: profileCompleteness.details
    }
  };
};

export const getVisibilityBusinessForUser = (businessId: string, userId: string) =>
  prisma.business.findFirst({
    where: { id: businessId, userId },
    include: {
      reviews: true
    }
  });

export const getCurrentVisibilityScoreForUser = async (businessId: string, userId: string) => {
  const business = await getVisibilityBusinessForUser(businessId, userId);

  if (!business) {
    return null;
  }

  const latestStoredScore = await prisma.visibilityScore.findFirst({
    where: { businessId },
    orderBy: { calculatedAt: 'desc' }
  });

  const calculated = calculateVisibilityScore(business);

  return {
    businessId,
    currentScore: latestStoredScore?.overallScore ?? calculated.overallScore,
    storedScore: latestStoredScore,
    breakdown: calculated
  };
};

export const calculateAndStoreVisibilityScore = async (businessId: string) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { reviews: true }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  const breakdown = calculateVisibilityScore(business);

  const storedScore = await prisma.visibilityScore.create({
    data: {
      businessId,
      overallScore: breakdown.overallScore,
      googlePresence: breakdown.googlePresence,
      websiteQuality: breakdown.websiteQuality,
      socialMediaActivity: breakdown.socialMediaActivity,
      reviewsReputation: breakdown.reviewsReputation,
      localSeo: breakdown.localSeo,
      profileCompleteness: breakdown.profileCompleteness,
      calculatedAt: breakdown.calculatedAt
    }
  });

  await prisma.business.update({
    where: { id: businessId },
    data: { visibilityScore: breakdown.overallScore }
  });

  return {
    businessId,
    score: storedScore,
    breakdown
  };
};

export const getVisibilityHistoryForUser = async (businessId: string, userId: string): Promise<VisibilityScore[] | null> => {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId },
    select: { id: true }
  });

  if (!business) {
    return null;
  }

  return prisma.visibilityScore.findMany({
    where: { businessId },
    orderBy: { calculatedAt: 'asc' }
  });
};