import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';

type PaginationInput = {
  page?: number;
  limit?: number;
  search?: string;
};

const buildPagination = (input: PaginationInput) => {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.max(1, Math.min(100, input.limit ?? 20));
  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

export const listAllBusinesses = async (input: PaginationInput) => {
  const pagination = buildPagination(input);
  const where = input.search
    ? {
        OR: [
          { name: { contains: input.search } },
          { city: { contains: input.search } },
          { email: { contains: input.search } }
        ]
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.business.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit
    }),
    prisma.business.count({ where })
  ]);

  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / pagination.limit))
    }
  };
};

export const listAllUsers = async (input: PaginationInput) => {
  const pagination = buildPagination(input);
  const where = input.search
    ? {
        OR: [
          { email: { contains: input.search } },
          { firstName: { contains: input.search } },
          { lastName: { contains: input.search } }
        ]
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit
    }),
    prisma.user.count({ where })
  ]);

  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / pagination.limit))
    }
  };
};

export const getPlatformStats = async () => {
  const [users, businesses, reviews, generatedContent, activeSubscriptions] = await Promise.all([
    prisma.user.count(),
    prisma.business.count(),
    prisma.review.count(),
    prisma.generatedContent.count(),
    prisma.userSubscription.count({
      where: { status: 'ACTIVE' }
    })
  ]);

  return {
    totalUsers: users,
    totalBusinesses: businesses,
    totalReviews: reviews,
    totalAiUsage: generatedContent,
    activeSubscriptions
  };
};

export const updateUserRole = (id: string, role: UserRole) =>
  prisma.user.update({
    where: { id },
    data: { role }
  });

export const deleteUserById = (id: string) =>
  prisma.user.delete({
    where: { id }
  });

export const getAiUsageStats = async () => {
  const [byType, recentUsage] = await Promise.all([
    prisma.generatedContent.groupBy({
      by: ['type'],
      _count: { id: true },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    }),
    prisma.generatedContent.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        business: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })
  ]);

  return {
    totalsByType: byType.map((entry) => ({
      type: entry.type,
      count: entry._count.id
    })),
    recentUsage
  };
};

export const getSubscriptionHelpers = async () => {
  const [plans, subscriptions] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    }),
    prisma.userSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        plan: true
      },
      orderBy: { endDate: 'asc' },
      take: 50
    })
  ]);

  return {
    plans,
    subscriptions
  };
};