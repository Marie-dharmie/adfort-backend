import OpenAI from 'openai';
import type { Business } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/database';

const categoryLabels: Record<Business['category'], string> = {
  RESTAURANT: 'restaurant',
  CAR_DEALERSHIP: 'car dealership',
  HOTEL: 'hotel',
  SALON: 'salon',
  RETAIL: 'retail store',
  OTHER: 'local business'
};

const buildLocationParts = (business: Business) =>
  [business.city, business.country].filter((value): value is string => Boolean(value && value.trim()));

const buildKeywordSuggestions = (business: Business) => {
  const category = categoryLabels[business.category];
  const location = buildLocationParts(business).join(' ');
  const baseTerms = [
    business.name,
    `${category} ${location}`.trim(),
    `best ${category} ${location}`.trim(),
    `${location} ${category}`.trim(),
    `${business.name} reviews`,
    `${business.name} ${location}`.trim()
  ];

  return Array.from(new Set(baseTerms.filter((term) => term.trim().length > 0)));
};

const buildSeoRecommendations = (business: Business) => {
  const category = categoryLabels[business.category];
  const location = buildLocationParts(business).join(', ');

  return [
    {
      priority: 'HIGH',
      title: 'Improve title tags',
      description: `Use title tags that combine ${business.name}, ${category}, and ${location || 'your service area'}.`
    },
    {
      priority: 'HIGH',
      title: 'Strengthen meta descriptions',
      description: `Write meta descriptions highlighting your value proposition, location, and a clear call to action.`
    },
    {
      priority: 'MEDIUM',
      title: 'Expand local keyword coverage',
      description: `Add neighborhood, city, and service-specific keywords across landing pages and headings.`
    },
    {
      priority: 'MEDIUM',
      title: 'Optimize Google Business Profile',
      description: `Keep hours, photos, categories, services, and review responses updated weekly.`
    },
    {
      priority: 'LOW',
      title: 'Publish local proof points',
      description: `Feature testimonials, FAQs, and local project examples to improve trust and relevance.`
    }
  ];
};

const buildChecklist = (business: Business) => [
  {
    item: 'Business name, address, and phone are complete',
    completed: Boolean(business.name && business.address && business.phone)
  },
  {
    item: 'Website URL is present',
    completed: Boolean(business.website)
  },
  {
    item: 'Business description includes services and location',
    completed: Boolean(business.description && buildLocationParts(business).length > 0)
  },
  {
    item: 'Google Business Profile photos are uploaded',
    completed: Array.isArray(business.images) && business.images.length > 0
  },
  {
    item: 'Social profiles are linked',
    completed: Boolean(business.socialLinks && typeof business.socialLinks === 'object' && Object.keys(business.socialLinks).length > 0)
  }
];

const buildWebsiteSuggestions = (business: Business) => [
  `Create dedicated pages for your main ${categoryLabels[business.category]} services.`,
  'Add clear calls to action above the fold and on service pages.',
  'Include structured local content such as FAQs, testimonials, and service-area references.',
  'Improve internal linking between homepage, services, and contact pages.'
];

const enhanceWithAi = async (business: Business, section: string, payload: unknown) => {
  if (!env.OPENAI_API_KEY) {
    return payload;
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  try {
    const completion = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: 'Enhance local SEO recommendations for a small business. Return concise JSON-compatible content only.'
        },
        {
          role: 'user',
          content: `Section: ${section}\nBusiness: ${JSON.stringify({
            name: business.name,
            category: business.category,
            description: business.description,
            city: business.city,
            country: business.country,
            website: business.website
          })}\nBase payload: ${JSON.stringify(payload)}`
        }
      ]
    });

    return completion.output_text.trim() || payload;
  } catch {
    return payload;
  }
};

export const getBusinessForSeo = (businessId: string, userId: string) =>
  prisma.business.findFirst({
    where: { id: businessId, userId }
  });

export const getKeywordSuggestions = async (business: Business) => {
  const keywords = buildKeywordSuggestions(business);
  return {
    businessId: business.id,
    keywords,
    aiEnhanced: await enhanceWithAi(business, 'keywords', keywords)
  };
};

export const getSeoRecommendations = async (business: Business) => {
  const recommendations = buildSeoRecommendations(business);
  return {
    businessId: business.id,
    recommendations,
    aiEnhanced: await enhanceWithAi(business, 'recommendations', recommendations)
  };
};

export const getLocalListingChecklist = async (business: Business) => {
  const checklist = buildChecklist(business);
  return {
    businessId: business.id,
    checklist,
    aiEnhanced: await enhanceWithAi(business, 'checklist', checklist)
  };
};

export const analyzeSeo = async (business: Business) => {
  const keywords = buildKeywordSuggestions(business);
  const recommendations = buildSeoRecommendations(business);
  const checklist = buildChecklist(business);
  const websiteSuggestions = buildWebsiteSuggestions(business);

  return {
    businessId: business.id,
    keywords,
    recommendations,
    checklist,
    websiteSuggestions,
    aiEnhanced: await enhanceWithAi(business, 'full-analysis', {
      keywords,
      recommendations,
      checklist,
      websiteSuggestions
    })
  };
};