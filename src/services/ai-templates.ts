import type { Business, BusinessCategory, GeneratedContentType, Review, VisibilityScore } from '@prisma/client';

type BusinessContext = {
  business: Business;
  latestVisibilityScore: VisibilityScore | null;
  reviews: Review[];
};

const categoryLabels: Record<BusinessCategory, string> = {
  RESTAURANT: 'restaurant',
  CAR_DEALERSHIP: 'car dealership',
  HOTEL: 'hotel',
  SALON: 'salon',
  RETAIL: 'retail business',
  OTHER: 'local business'
};

const averageRating = (reviews: Review[]) => {
  if (!reviews.length) {
    return null;
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1);
};

const reviewSummary = (reviews: Review[]) => {
  if (!reviews.length) {
    return 'You are still building your review presence, so focus on generating first-party trust signals and inviting happy customers to leave feedback.';
  }

  const positive = reviews.filter((review) => review.sentiment === 'POSITIVE').length;
  const neutral = reviews.filter((review) => review.sentiment === 'NEUTRAL').length;
  const negative = reviews.filter((review) => review.sentiment === 'NEGATIVE').length;
  const topComment = reviews.find((review) => review.comment)?.comment;

  return `You currently have ${reviews.length} reviews with ${positive} positive, ${neutral} neutral, and ${negative} negative. ${topComment ? `A recent customer mentioned: "${topComment}".` : 'Customers are giving you useful signals about what to improve and promote.'}`;
};

const scoreSummary = (context: BusinessContext) => {
  const score = context.latestVisibilityScore;

  if (!score) {
    return `Your current visibility score is ${context.business.visibilityScore}/100. Build momentum by improving your profile completeness, posting consistently, and collecting more reviews.`;
  }

  return `Your latest visibility snapshot shows overall ${score.overallScore}/100, Google presence ${score.googlePresence}/100, website quality ${score.websiteQuality}/100, social activity ${score.socialMediaActivity}/100, reviews reputation ${score.reviewsReputation}/100, local SEO ${score.localSeo}/100, and profile completeness ${score.profileCompleteness}/100.`;
};

const businessSnapshot = (context: BusinessContext) => {
  const rating = averageRating(context.reviews);

  return `${context.business.name} is a ${categoryLabels[context.business.category]}${context.business.city ? ` in ${context.business.city}` : ''}. ${context.business.description ? context.business.description : 'The business needs practical, local-first marketing guidance.'} ${rating ? `Average rating is ${rating}/5.` : 'There is not enough review data yet to calculate an average rating.'} ${scoreSummary(context)} ${reviewSummary(context.reviews)}`;
};

export const buildMockAssistantReply = (
  context: BusinessContext,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
) => {
  const lowerMessage = userMessage.toLowerCase();
  const historyHint = conversationHistory.length
    ? `I also considered your previous ${conversationHistory.length} message${conversationHistory.length === 1 ? '' : 's'} so this advice stays consistent.`
    : 'This is a fresh recommendation based on your current business profile.';

  if (lowerMessage.includes('review')) {
    return `${businessSnapshot(context)} ${historyHint} Prioritize a review-response workflow this week: reply to every new review within 24 hours, thank positive reviewers by name, and address negative feedback with one concrete fix. Then ask recent happy customers for Google reviews using a short SMS or QR code prompt.`;
  }

  if (lowerMessage.includes('social') || lowerMessage.includes('instagram') || lowerMessage.includes('facebook')) {
    return `${businessSnapshot(context)} ${historyHint} Your fastest growth lever is consistent social proof. Post three times per week: one customer story, one behind-the-scenes moment, and one offer-driven post. Use location tags, mention your strongest differentiator, and end each post with a simple action like booking, calling, or visiting today.`;
  }

  if (lowerMessage.includes('seo') || lowerMessage.includes('google')) {
    return `${businessSnapshot(context)} ${historyHint} Focus on local visibility first: refresh your Google Business Profile categories, add new photos weekly, publish one Google update every 7 days, and make sure your website headlines mention your service and city together. This will improve discovery faster than broad branding work.`;
  }

  return `${businessSnapshot(context)} ${historyHint} My recommendation is to focus on one quick-win channel and one trust-building channel. Quick win: launch a short promotional offer with a clear deadline. Trust-building: publish customer-focused content that highlights outcomes, reviews, and what makes your business different locally. Track responses for 14 days and double down on the best-performing message.`;
};

const contentTemplates: Record<GeneratedContentType, (context: BusinessContext, instructions?: string) => { title: string; content: string }> = {
  FACEBOOK_POST: (context, instructions) => ({
    title: `${context.business.name} Facebook Post`,
    content: `✨ ${context.business.name} is here to help ${context.business.city ? `${context.business.city} locals` : 'local customers'} get more from every visit.\n\n${context.business.description ?? 'We focus on quality, consistency, and a great customer experience every time.'}\n\nThis week, we’re inviting you to stop by and see what makes us different. ${instructions ? `${instructions}\n\n` : ''}If you’ve visited us before, leave a review or tag someone who should check us out.\n\n#ShopLocal #${context.business.name.replace(/\s+/g, '')}`
  }),
  INSTAGRAM_CAPTION: (context, instructions) => ({
    title: `${context.business.name} Instagram Caption`,
    content: `${context.business.name}, but make it unforgettable. ${context.business.description ?? 'Serving our community with standout quality and personal service.'} ${instructions ? `${instructions} ` : ''}Come experience it for yourself and tag us in your visit.\n\n#LocalFavorite #SupportLocal #${context.business.city ? context.business.city.replace(/\s+/g, '') : 'Community'}`
  }),
  PROMO_CAMPAIGN: (context, instructions) => ({
    title: `${context.business.name} Promo Campaign`,
    content: `Campaign Idea: “Limited-Time Local Favorite Offer”\n\nAudience: Nearby customers and returning visitors\nOffer: Create a time-sensitive promotion that rewards immediate action\nCore Message: ${context.business.name} delivers trusted local value with a personal touch\nChannels: Facebook, Instagram, Google Business Profile, email\nCTA: Book now, visit today, or claim the offer before it ends\nExecution Notes: ${instructions ?? 'Use customer testimonials, strong visuals, and a 7-day deadline to increase urgency.'}`
  }),
  GOOGLE_UPDATE: (context, instructions) => ({
    title: `${context.business.name} Google Update`,
    content: `We’ve got something new at ${context.business.name}. ${context.business.description ?? 'Our team is focused on delivering a better local experience every day.'} ${instructions ? `${instructions} ` : ''}Visit us today, explore what’s new, and let us know how we can help.`
  }),
  MARKETING_EMAIL: (context, instructions) => ({
    title: `${context.business.name} Marketing Email`,
    content: `Subject: A fresh reason to visit ${context.business.name}\n\nHi there,\n\nAt ${context.business.name}, we’re always looking for ways to give our customers more value. ${context.business.description ?? 'That means better service, stronger offers, and a more memorable experience.'}\n\n${instructions ?? 'For a limited time, we’re highlighting one of our most popular offers for local customers.'}\n\nIf you’ve been meaning to stop by, now is the perfect time. We’d love to welcome you soon.\n\nBest,\nThe ${context.business.name} Team`
  }),
  AD_COPY: (context, instructions) => ({
    title: `${context.business.name} Ad Copy`,
    content: `Headline: Discover ${context.business.name}\nPrimary Text: ${context.business.description ?? 'Trusted by local customers for quality, service, and results.'} ${instructions ?? 'Act now to take advantage of a limited-time offer.'}\nCTA: Learn More`
  }),
  PRODUCT_DESCRIPTION: (context, instructions) => ({
    title: `${context.business.name} Product Description`,
    content: `${context.business.name} brings together quality, reliability, and a customer-first experience. Designed for people who value great service and real results, this offering stands out for its attention to detail and local reputation. ${instructions ?? 'Perfect for customers looking for a dependable choice with a personal touch.'}`
  }),
  MENU_PROMO: (context, instructions) => ({
    title: `${context.business.name} Menu Promo`,
    content: `Today’s spotlight at ${context.business.name}: a customer-favorite pick made to keep you coming back. ${instructions ?? 'Pair it with a limited-time add-on or combo to increase average order value.'} Stop in and try it while it’s featured.`
  }),
  VEHICLE_PROMO: (context, instructions) => ({
    title: `${context.business.name} Vehicle Promo`,
    content: `Featured this week at ${context.business.name}: a standout vehicle that combines value, style, and confidence on the road. ${instructions ?? 'Highlight financing flexibility, trade-in options, and a limited-time incentive.'} Contact us today to schedule a test drive.`
  })
};

export const buildMockGeneratedContent = (
  context: BusinessContext,
  type: GeneratedContentType,
  additionalInstructions?: string
) => contentTemplates[type](context, additionalInstructions);
