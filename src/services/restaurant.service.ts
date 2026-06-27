import { buildIndustryContext, generateIndustryContent, type IndustryBusinessContext } from './industry.service.shared';

type MenuPromoInput = IndustryBusinessContext & {
  menuItems: string[];
  promotionAngle?: string;
};

type DailySpecialInput = IndustryBusinessContext & {
  specialName: string;
  specialDescription: string;
  availableDay?: string;
  pricePoint?: string;
};

type EventPromoInput = IndustryBusinessContext & {
  eventName: string;
  eventType?: string;
  eventDate?: string;
  eventDetails?: string;
};

type LoyaltyCampaignInput = IndustryBusinessContext & {
  loyaltyProgram?: string;
  customerBehavior?: string;
};

type FoodContentInput = IndustryBusinessContext & {
  dishName?: string;
  ingredients?: string[];
  contentFormat?: string;
};

const restaurantSystemPrompt = (context: IndustryBusinessContext) => `You are a restaurant marketing strategist and copywriter.
Create polished, conversion-focused content for restaurants that feels local, appetizing, and action-oriented.

Business context:
${buildIndustryContext(context)}`;

export const generateMenuPromotion = async (input: MenuPromoInput) =>
  generateIndustryContent(
    restaurantSystemPrompt(input),
    `Create a menu promotion for these menu items: ${input.menuItems.join(', ')}.
Promotion angle: ${input.promotionAngle ?? 'Highlight craveability, freshness, and urgency.'}`,
    {
      title: `${input.businessName} Menu Spotlight`,
      content: `Turn up the flavor at ${input.businessName} with our featured picks: ${input.menuItems.join(', ')}. ${input.promotionAngle ?? 'Fresh ingredients, bold flavor, and a limited-time reason to stop in today.'} Visit ${input.city ?? 'us'} and treat yourself before this spotlight changes.`
    }
  );

export const generateDailySpecialCampaign = async (input: DailySpecialInput) =>
  generateIndustryContent(
    restaurantSystemPrompt(input),
    `Create a daily special campaign for "${input.specialName}".
Description: ${input.specialDescription}
Available day: ${input.availableDay ?? 'Today'}
Price point: ${input.pricePoint ?? 'Not specified'}`,
    {
      title: `${input.businessName} Daily Special`,
      content: `${input.availableDay ?? 'Today'} at ${input.businessName}: ${input.specialName}. ${input.specialDescription} ${input.pricePoint ? `Available for ${input.pricePoint}.` : ''} Make today’s meal easy, delicious, and worth talking about.`
    }
  );

export const generateEventPromotion = async (input: EventPromoInput) =>
  generateIndustryContent(
    restaurantSystemPrompt(input),
    `Create an event promotion for "${input.eventName}".
Event type: ${input.eventType ?? 'Restaurant event'}
Event date: ${input.eventDate ?? 'TBD'}
Details: ${input.eventDetails ?? 'Create excitement and attendance.'}`,
    {
      title: `${input.businessName} Presents ${input.eventName}`,
      content: `Join us at ${input.businessName} for ${input.eventName}${input.eventDate ? ` on ${input.eventDate}` : ''}. ${input.eventDetails ?? 'Expect great food, a welcoming atmosphere, and a reason to gather with friends.'} Reserve your spot or stop by early to be part of it.`
    }
  );

export const generateLoyaltyCampaignSuggestions = async (input: LoyaltyCampaignInput) =>
  generateIndustryContent(
    restaurantSystemPrompt(input),
    `Create a loyalty campaign suggestion.
Current loyalty program: ${input.loyaltyProgram ?? 'None'}
Customer behavior insight: ${input.customerBehavior ?? 'Encourage repeat visits and higher average order value.'}`,
    {
      title: `${input.businessName} Loyalty Campaign`,
      content: `Reward regulars at ${input.businessName} with a simple repeat-visit offer. ${input.loyaltyProgram ? `Build on your current ${input.loyaltyProgram} program` : 'Launch a punch-card or points-based incentive'} and give guests a clear reason to come back within the next 7 days. Pair it with SMS or social reminders to keep momentum high.`
    }
  );

export const generateFoodMarketingContent = async (input: FoodContentInput) =>
  generateIndustryContent(
    restaurantSystemPrompt(input),
    `Create ${input.contentFormat ?? 'food marketing'} content.
Dish name: ${input.dishName ?? 'Chef feature'}
Ingredients: ${input.ingredients?.join(', ') ?? 'Not specified'}`,
    {
      title: `${input.businessName} Food Feature`,
      content: `${input.dishName ?? 'Our latest kitchen feature'} at ${input.businessName} is built to tempt every craving. ${input.ingredients?.length ? `Made with ${input.ingredients.join(', ')}, ` : ''}it’s the kind of dish that turns a quick visit into a memorable one. Stop by and taste what everyone will be talking about.`
    }
  );