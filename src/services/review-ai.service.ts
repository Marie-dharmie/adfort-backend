import OpenAI from 'openai';
import { ReviewSentiment, type Business, type Review } from '@prisma/client';
import { env } from '../config/env';

const getTemplateResponse = (review: Review) => {
  if (review.sentiment === ReviewSentiment.POSITIVE) {
    return `Thank you, ${review.reviewerName}, for your kind words and ${review.rating}-star review. We're glad you had a great experience and look forward to serving you again.`;
  }

  if (review.sentiment === ReviewSentiment.NEGATIVE) {
    return `Thank you for your feedback, ${review.reviewerName}. We're sorry your experience did not meet expectations. We take your concerns seriously and would appreciate the opportunity to make things right. Please contact us directly so we can help resolve this.`;
  }

  return `Thank you, ${review.reviewerName}, for taking the time to share your feedback. We appreciate your input and will use it to continue improving our service.`;
};

export const generateReviewResponse = async (review: Review & { business?: Business | null }) => {
  if (!env.OPENAI_API_KEY) {
    return getTemplateResponse(review);
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const businessName = review.business?.name ?? 'our business';

  try {
    const completion = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            'Write concise, professional business responses to customer reviews. Keep the tone empathetic, specific, and under 120 words.'
        },
        {
          role: 'user',
          content: `Business: ${businessName}\nReviewer: ${review.reviewerName}\nRating: ${review.rating}\nSentiment: ${review.sentiment}\nReview: ${review.comment ?? 'No written comment'}`
        }
      ]
    });

    const responseText = completion.output_text.trim();
    return responseText || getTemplateResponse(review);
  } catch {
    return getTemplateResponse(review);
  }
};