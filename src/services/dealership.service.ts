import { buildIndustryContext, generateIndustryContent, type IndustryBusinessContext } from './industry.service.shared';

type VehiclePromoInput = IndustryBusinessContext & {
  year: number;
  make: string;
  model: string;
  trim?: string;
  price?: string;
  mileage?: string;
  features?: string[];
};

type FinancingCampaignInput = IndustryBusinessContext & {
  financingOffer: string;
  eligibility?: string;
  deadline?: string;
};

type NewArrivalInput = IndustryBusinessContext & {
  inventoryHighlights: string[];
  arrivalWindow?: string;
};

type LeadGenerationInput = IndustryBusinessContext & {
  campaignOffer: string;
  targetBuyer?: string;
  landingPageGoal?: string;
};

type ListingOptimizerInput = IndustryBusinessContext & {
  vehicleTitle: string;
  vehicleDescription?: string;
  features?: string[];
};

const dealershipSystemPrompt = (context: IndustryBusinessContext) => `You are an automotive marketing strategist and copywriter.
Create persuasive dealership marketing content that builds trust, highlights value, and drives leads.

Business context:
${buildIndustryContext(context)}`;

export const generateVehiclePromotion = async (input: VehiclePromoInput) =>
  generateIndustryContent(
    dealershipSystemPrompt(input),
    `Create a vehicle promotion for a ${input.year} ${input.make} ${input.model} ${input.trim ?? ''}.
Price: ${input.price ?? 'Not specified'}
Mileage: ${input.mileage ?? 'Not specified'}
Features: ${input.features?.join(', ') ?? 'Not specified'}`,
    {
      title: `${input.businessName} ${input.year} ${input.make} ${input.model}`,
      content: `Drive home in this ${input.year} ${input.make} ${input.model}${input.trim ? ` ${input.trim}` : ''} from ${input.businessName}. ${input.features?.length ? `Standout features include ${input.features.join(', ')}. ` : ''}${input.price ? `Priced at ${input.price}. ` : ''}${input.mileage ? `Mileage: ${input.mileage}. ` : ''}Schedule your test drive today before it’s gone.`
    }
  );

export const generateFinancingCampaign = async (input: FinancingCampaignInput) =>
  generateIndustryContent(
    dealershipSystemPrompt(input),
    `Create a financing campaign.
Offer: ${input.financingOffer}
Eligibility: ${input.eligibility ?? 'Broad buyer audience'}
Deadline: ${input.deadline ?? 'Limited time'}`,
    {
      title: `${input.businessName} Financing Offer`,
      content: `${input.financingOffer} at ${input.businessName}. ${input.eligibility ? `Designed for ${input.eligibility}. ` : ''}${input.deadline ? `Available through ${input.deadline}. ` : ''}Make your next vehicle more affordable with a financing option built around your budget.`
    }
  );

export const generateNewArrivalAnnouncement = async (input: NewArrivalInput) =>
  generateIndustryContent(
    dealershipSystemPrompt(input),
    `Create a new arrival announcement.
Inventory highlights: ${input.inventoryHighlights.join(', ')}
Arrival window: ${input.arrivalWindow ?? 'Now available'}`,
    {
      title: `${input.businessName} New Arrivals`,
      content: `Fresh inventory has arrived at ${input.businessName}. Explore ${input.inventoryHighlights.join(', ')}${input.arrivalWindow ? `, available ${input.arrivalWindow}` : ''}. If you’ve been waiting for the right fit, now is the time to browse, compare, and book a test drive.`
    }
  );

export const generateLeadGenerationCampaign = async (input: LeadGenerationInput) =>
  generateIndustryContent(
    dealershipSystemPrompt(input),
    `Create a lead generation campaign.
Offer: ${input.campaignOffer}
Target buyer: ${input.targetBuyer ?? 'Local car shoppers'}
Landing page goal: ${input.landingPageGoal ?? 'Increase test drive and inquiry submissions'}`,
    {
      title: `${input.businessName} Lead Generation Campaign`,
      content: `Campaign focus: ${input.campaignOffer}. Target ${input.targetBuyer ?? 'local car shoppers'} with a clear value proposition, fast inquiry form, and strong test-drive CTA. Use paid social, search, and retargeting to move buyers from interest to appointment quickly.`
    }
  );

export const optimizeVehicleListing = async (input: ListingOptimizerInput) =>
  generateIndustryContent(
    dealershipSystemPrompt(input),
    `Optimize a vehicle listing.
Vehicle title: ${input.vehicleTitle}
Current description: ${input.vehicleDescription ?? 'Not provided'}
Features: ${input.features?.join(', ') ?? 'Not specified'}`,
    {
      title: `${input.vehicleTitle} Listing Optimization`,
      content: `${input.vehicleTitle} at ${input.businessName}. ${input.vehicleDescription ?? 'Well-maintained and ready for its next owner.'} ${input.features?.length ? `Top features: ${input.features.join(', ')}. ` : ''}Emphasize condition, value, financing flexibility, and a direct call to schedule a viewing or test drive.`
    }
  );