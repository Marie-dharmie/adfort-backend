import OpenAI from 'openai';
import type { Business, GeneratedContentType, Review, VisibilityScore } from '@prisma/client';
import { env } from '../config/env';
import { buildMockAssistantReply, buildMockGeneratedContent } from './ai-templates';

export type ConversationMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type BusinessAiContext = {
  business: Business;
  latestVisibilityScore: VisibilityScore | null;
  reviews: Review[];
};

const openAiClient = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

const placeholderKeys = ['your_openai_api_key', 'sk-', 'placeholder', 'changeme', 'replace_me'];

export const hasUsableOpenAiKey = () => {
  const key = env.OPENAI_API_KEY.trim();

  if (!key) {
    return false;
  }

  const normalized = key.toLowerCase();
  return !placeholderKeys.some((placeholder) => normalized === placeholder || normalized.includes(placeholder));
};

const summarizeReviews = (reviews: Review[]) => {
  if (!reviews.length) {
    return 'No customer reviews are available yet.';
  }

  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const highlights = reviews
    .filter((review) => review.comment)
    .slice(0, 3)
    .map((review) => `- ${review.rating}/5 (${review.sentiment}): ${review.comment}`)
    .join('\n');

  return `Review count: ${reviews.length}\nAverage rating: ${average.toFixed(1)}/5\nRecent review highlights:\n${highlights || '- No written comments yet.'}`;
};

const buildBusinessContextPrompt = (context: BusinessAiContext) => {
  const { business, latestVisibilityScore } = context;

  return [
    `Business name: ${business.name}`,
    `Category: ${business.category}`,
    `Description: ${business.description ?? 'N/A'}`,
    `Location: ${[business.address, business.city, business.country].filter(Boolean).join(', ') || 'N/A'}`,
    `Website: ${business.website ?? 'N/A'}`,
    `Phone: ${business.phone ?? 'N/A'}`,
    `Email: ${business.email ?? 'N/A'}`,
    `Visibility score: ${business.visibilityScore}/100`,
    latestVisibilityScore
      ? `Detailed visibility metrics: overall ${latestVisibilityScore.overallScore}/100, Google presence ${latestVisibilityScore.googlePresence}/100, website quality ${latestVisibilityScore.websiteQuality}/100, social media activity ${latestVisibilityScore.socialMediaActivity}/100, reviews reputation ${latestVisibilityScore.reviewsReputation}/100, local SEO ${latestVisibilityScore.localSeo}/100, profile completeness ${latestVisibilityScore.profileCompleteness}/100`
      : 'Detailed visibility metrics: not available yet.',
    summarizeReviews(context.reviews)
  ].join('\n');
};

const contentTypeInstructions: Record<GeneratedContentType, string> = {
  FACEBOOK_POST: 'Write a friendly Facebook post with a strong hook, 2 short paragraphs, and a clear call to action. Keep it community-oriented and around 80-140 words.',
  INSTAGRAM_CAPTION: 'Write an Instagram caption with an energetic tone, concise storytelling, and a CTA. Keep it around 50-100 words and include 4-6 relevant hashtags.',
  PROMO_CAMPAIGN: 'Create a compact promotional campaign brief with audience, offer, message angle, channels, CTA, and execution notes.',
  GOOGLE_UPDATE: 'Write a Google Business Profile update in a concise, local-first tone. Keep it around 60-100 words and action-oriented.',
  MARKETING_EMAIL: 'Write a marketing email with a subject line and body. Keep it persuasive, warm, and easy to scan.',
  AD_COPY: 'Write ad copy with a headline, primary text, and CTA. Keep it punchy, benefit-led, and conversion-focused.',
  PRODUCT_DESCRIPTION: 'Write a product or service description that is clear, persuasive, and benefit-focused. Keep it around 70-130 words.',
  MENU_PROMO: 'Write a menu promotion with appetite appeal, urgency, and a simple CTA. Keep it concise and vivid.',
  VEHICLE_PROMO: 'Write a vehicle promotion with trust, value, and urgency. Mention standout benefits and a CTA.'
};

const createChatSystemPrompt = (context: BusinessAiContext) => `You are an AI growth assistant for small businesses. You are an expert in local marketing, visibility, reputation management, social media, and conversion-focused messaging.

Use the business context below to give personalized, practical advice. Be specific, concise, and action-oriented. Prioritize recommendations that fit the business category, local presence, visibility scores, and customer review signals. Avoid generic advice. When useful, suggest next steps in bullet points.

Business context:
${buildBusinessContextPrompt(context)}`;

export const chatWithAssistant = async (
  businessContext: BusinessAiContext,
  userMessage: string,
  conversationHistory: ConversationMessage[]
) => {
  if (!hasUsableOpenAiKey() || !openAiClient) {
    return buildMockAssistantReply(businessContext, userMessage, conversationHistory);
  }

  try {
    const response = await openAiClient.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: createChatSystemPrompt(businessContext) },
        ...conversationHistory
          .filter((message) => message.role === 'user' || message.role === 'assistant')
          .map((message) => ({ role: message.role, content: message.content })),
        { role: 'user', content: userMessage }
      ]
    });

    return response.output_text.trim();
  } catch {
    return buildMockAssistantReply(businessContext, userMessage, conversationHistory);
  }
};

export const generateContent = async (
  businessContext: BusinessAiContext,
  contentType: GeneratedContentType,
  additionalInstructions?: string
) => {
  if (!hasUsableOpenAiKey() || !openAiClient) {
    return buildMockGeneratedContent(businessContext, contentType, additionalInstructions);
  }

  try {
    const response = await openAiClient.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: `You are an expert small-business marketing copywriter. Create polished, platform-appropriate content tailored to the business context below.\n\n${buildBusinessContextPrompt(businessContext)}`
        },
        {
          role: 'user',
          content: `Generate ${contentType} content.\nInstructions: ${contentTypeInstructions[contentType]}\nAdditional instructions: ${additionalInstructions ?? 'None'}\nReturn a JSON object with keys "title" and "content".`
        }
      ]
    });

    const rawText = response.output_text.trim();

    try {
      const parsed = JSON.parse(rawText) as { title: string; content: string };
      return {
        title: parsed.title,
        content: parsed.content
      };
    } catch {
      return {
        title: `${businessContext.business.name} ${contentType.replace(/_/g, ' ')}`,
        content: rawText
      };
    }
  } catch {
    return buildMockGeneratedContent(businessContext, contentType, additionalInstructions);
  }
};
