import { Router } from 'express';
import {
  postDealershipFinancingCampaign,
  postDealershipLeadGen,
  postDealershipListingOptimize,
  postDealershipNewArrival,
  postDealershipVehiclePromo,
  postRestaurantDailySpecial,
  postRestaurantEventPromo,
  postRestaurantFoodContent,
  postRestaurantLoyaltyCampaign,
  postRestaurantMenuPromo
} from '../controllers/industry.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/restaurant/menu-promo', postRestaurantMenuPromo);
router.post('/restaurant/daily-special', postRestaurantDailySpecial);
router.post('/restaurant/event-promo', postRestaurantEventPromo);
router.post('/restaurant/loyalty-campaign', postRestaurantLoyaltyCampaign);
router.post('/restaurant/food-content', postRestaurantFoodContent);

router.post('/dealership/vehicle-promo', postDealershipVehiclePromo);
router.post('/dealership/financing-campaign', postDealershipFinancingCampaign);
router.post('/dealership/new-arrival', postDealershipNewArrival);
router.post('/dealership/lead-gen', postDealershipLeadGen);
router.post('/dealership/listing-optimize', postDealershipListingOptimize);

export default router;