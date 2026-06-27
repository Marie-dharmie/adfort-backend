import bcrypt from 'bcryptjs';
import { PrismaClient, BusinessCategory, GeneratedContentStatus, GeneratedContentType, RecommendationPriority, RecommendationStatus, ReviewSentiment, SubscriptionStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.session.deleteMany();
  await prisma.userSubscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.analytics.deleteMany();
  await prisma.competitorData.deleteMany();
  await prisma.aiRecommendation.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.generatedContent.deleteMany();
  await prisma.review.deleteMany();
  await prisma.visibilityScore.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const demoPassword = await bcrypt.hash('demo123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@adfort.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      emailVerified: true
    }
  });

  const demoUser = await prisma.user.create({
    data: {
      email: 'tony@pizzahouse.com',
      passwordHash: demoPassword,
      firstName: 'Tony',
      lastName: 'Marino',
      role: UserRole.OWNER,
      emailVerified: true
    }
  });

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Growth',
      price: 79,
      features: ['AI content generation', 'Review monitoring', 'Competitor tracking'],
      maxBusinesses: 3,
      aiCredits: 500
    }
  });

  await prisma.userSubscription.create({
    data: {
      userId: demoUser.id,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  const business = await prisma.business.create({
    data: {
      name: "Tony's Pizza House",
      category: BusinessCategory.RESTAURANT,
      description: 'Family-owned pizza restaurant serving Dallas with handcrafted pies and fast delivery.',
      address: '1458 Elm Street',
      city: 'Dallas',
      country: 'USA',
      phone: '+1 214-555-0199',
      email: 'hello@tonyspizzahouse.com',
      website: 'https://tonyspizzahouse.com',
      socialLinks: {
        instagram: 'https://instagram.com/tonyspizzahouse',
        facebook: 'https://facebook.com/tonyspizzahouse'
      },
      openingHours: {
        monday: '11:00-22:00',
        tuesday: '11:00-22:00',
        wednesday: '11:00-22:00',
        thursday: '11:00-22:00',
        friday: '11:00-23:00',
        saturday: '11:00-23:00',
        sunday: '12:00-21:00'
      },
      images: ['pizza-front.jpg', 'dining-room.jpg'],
      userId: demoUser.id,
      visibilityScore: 84
    }
  });

  const visibilityHistory = Array.from({ length: 30 }).map((_, index) => ({
    businessId: business.id,
    overallScore: 58 + index,
    googlePresence: 55 + index,
    websiteQuality: 52 + index,
    socialMediaActivity: 48 + index,
    reviewsReputation: 62 + Math.min(index, 24),
    localSeo: 50 + index,
    profileCompleteness: 60 + Math.min(index, 25),
    calculatedAt: new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000)
  }));

  await prisma.visibilityScore.createMany({
    data: visibilityHistory
  });

  await prisma.review.createMany({
    data: [
      {
        businessId: business.id,
        reviewerName: 'Jessica Martinez',
        rating: 5,
        comment: 'Great food and amazing service! Will definitely be back.',
        sentiment: ReviewSentiment.POSITIVE,
        sentimentScore: 0.96,
        aiResponse: 'Thanks Jessica! We look forward to serving you again soon.',
        source: 'Google',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        businessId: business.id,
        reviewerName: 'Robert Thompson',
        rating: 4,
        comment: 'Good experience overall. The staff was friendly.',
        sentiment: ReviewSentiment.POSITIVE,
        sentimentScore: 0.74,
        aiResponse: 'Thanks Robert, we appreciate the kind words.',
        source: 'Google',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        businessId: business.id,
        reviewerName: 'David Lee',
        rating: 2,
        comment: 'The pizza was good but delivery took longer than expected.',
        sentiment: ReviewSentiment.NEGATIVE,
        sentimentScore: -0.52,
        aiResponse: 'Sorry about the delay, David. We are improving our delivery times.',
        source: 'Yelp',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        businessId: business.id,
        reviewerName: 'Maria Garcia',
        rating: 5,
        comment: 'Love this place! Best pizza in town.',
        sentiment: ReviewSentiment.POSITIVE,
        sentimentScore: 0.98,
        aiResponse: 'Thank you Maria! That means a lot to our team.',
        source: 'Facebook',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  const analyticsData = Array.from({ length: 30 }).map((_, index) => ({
    businessId: business.id,
    date: new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000),
    impressions: 1800 + index * 35,
    clicks: 90 + index * 4,
    conversions: 10 + Math.floor(index / 2),
    costPerConversion: 22 - index * 0.11,
    websiteTraffic: 55 + index * 3,
    reviewCount: 120 + Math.floor(index / 5),
    avgRating: 4.4 + index * 0.006
  }));

  await prisma.analytics.createMany({ data: analyticsData });

  await prisma.aiRecommendation.createMany({
    data: [
      {
        businessId: business.id,
        category: 'Google Business Profile',
        title: 'Increase Google Business Profile posts',
        description: 'Businesses that post weekly get 2.1x more views.',
        priority: RecommendationPriority.HIGH,
        status: RecommendationStatus.PENDING
      },
      {
        businessId: business.id,
        category: 'Reviews',
        title: 'Respond to recent negative reviews',
        description: 'Protect your rating and build trust with timely responses.',
        priority: RecommendationPriority.HIGH,
        status: RecommendationStatus.PENDING
      },
      {
        businessId: business.id,
        category: 'Campaign',
        title: 'Boost weekend traffic',
        description: 'Launch a targeted campaign to nearby customers this weekend.',
        priority: RecommendationPriority.MEDIUM,
        status: RecommendationStatus.PENDING
      }
    ]
  });

  await prisma.competitorData.createMany({
    data: [
      {
        businessId: business.id,
        competitorName: 'Luigi Pizza Bar',
        reviewCount: 312,
        avgRating: 4.5,
        socialFollowers: 4200,
        visibilityScore: 84,
        lastUpdated: new Date()
      },
      {
        businessId: business.id,
        competitorName: 'Downtown Slice Co.',
        reviewCount: 280,
        avgRating: 4.3,
        socialFollowers: 3900,
        visibilityScore: 81,
        lastUpdated: new Date()
      }
    ]
  });

  await prisma.generatedContent.create({
    data: {
      businessId: business.id,
      userId: demoUser.id,
      type: GeneratedContentType.FACEBOOK_POST,
      title: 'Weekend Pizza Promo',
      content: 'Dallas pizza lovers: enjoy 15% off all large pies this weekend only.',
      status: GeneratedContentStatus.SAVED
    }
  });

  await prisma.aiConversation.create({
    data: {
      userId: demoUser.id,
      businessId: business.id,
      messages: [
        { role: 'user', content: 'How can I improve weekend traffic?' },
        { role: 'assistant', content: 'Run a geo-targeted promotion and post on Google Business Profile.' }
      ]
    }
  });

  console.log({
    adminEmail: admin.email,
    demoEmail: demoUser.email,
    demoBusiness: business.name
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });