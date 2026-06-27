import type { BusinessCategory } from '@prisma/client';
import OpenAI from 'openai';
import { env } from '../config/env';
import { hasUsableOpenAiKey } from './ai.service';

export type IndustryBusinessContext = {
  businessName: string;
  category?: BusinessCategory | string;
  city?: string;
  description?: string;
  audience?: string;
  tone?: string;
  offer?: string;
  channels?: string[];
  goals?: string[];
};

export type IndustryGeneratedContent = {
  title: string;
  content: string;
};

const openAiClient = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export const buildIndustryContext = (context: IndustryBusinessContext) =>
  [
    `Business name: ${context.businessName}`,
    `Category: ${context.category ?? 'N/A'}`,
    `City: ${context.city ?? 'N/A'}`,
    `Description: ${context.description ?? 'N/A'}`,
    `Audience: ${context.audience ?? 'N/A'}`,
    `Tone: ${context.tone ?? 'N/A'}`,
    `Offer: ${context.offer ?? 'N/A'}`,
    `Channels: ${context.channels?.join(', ') ?? 'N/A'}`,
    `Goals: ${context.goals?.join(', ') ?? 'N/A'}`
  ].join('\n');

export const generateIndustryContent = async (
  systemPrompt: string,
  userPrompt: string,
  fallback: IndustryGeneratedContent
) => {
  if (!hasUsableOpenAiKey() || !openAiClient) {
    return fallback;
  }

  try {
    const response = await openAiClient.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${userPrompt}\nReturn a JSON object with keys "title" and "content".`
        }
      ]
    });

    const rawText = response.output_text.trim();

    try {
      const parsed = JSON.parse(rawText) as IndustryGeneratedContent;
      return {
        title: parsed.title,
        content: parsed.content
      };
    } catch {
      return {
        title: fallback.title,
        content: rawText
      };
    }
  } catch {
    return fallback;
  }
};