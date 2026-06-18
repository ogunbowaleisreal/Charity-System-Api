import { Router } from "express";
import { SubscriberController } from "../../controllers/client/subscriber.comtroller";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();

const subscriberCtrl =
    new SubscriberController();

router.use(rateLimiter.general);

/**
 * Subscribe to newsletter
 */
router.post(
    "/subscribe",
    subscriberCtrl.subscribe.bind(
        subscriberCtrl
    )
);

/**
 * Unsubscribe from newsletter
 */
router.post(
    "/unsubscribe",
    subscriberCtrl.unsubscribe.bind(
        subscriberCtrl
    )
);

export default router;