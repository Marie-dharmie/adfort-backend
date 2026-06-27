import type { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { calculateAndStoreVisibilityScore } from './visibility.service';

export const createBusiness = async (data: Prisma.BusinessUncheckedCreateInput) => {
  const business = await prisma.business.create({ data });
  await calculateAndStoreVisibilityScore(business.id);
  return prisma.business.findUniqueOrThrow({ where: { id: business.id } });
};

export const listBusinessesForUser = (userId: string) =>
  prisma.business.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

export const getBusinessForUser = (id: string, userId: string) =>
  prisma.business.findFirst({
    where: { id, userId },
    include: {
      visibilityScores: {
        orderBy: { calculatedAt: 'desc' }
      },
      reviews: {
        orderBy: { createdAt: 'desc' }
      },
      analytics: {
        orderBy: { date: 'desc' },
        take: 30
      },
      recommendations: {
        orderBy: { createdAt: 'desc' }
      },
      competitors: {
        orderBy: { lastUpdated: 'desc' }
      }
    }
  });

export const updateBusinessForUser = (
  id: string,
  userId: string,
  data: Prisma.BusinessUpdateInput
) =>
  prisma.business
    .updateMany({
      where: { id, userId },
      data
    })
    .then(async (result) => {
      if (result.count > 0) {
        await calculateAndStoreVisibilityScore(id);
      }

      return result;
    });