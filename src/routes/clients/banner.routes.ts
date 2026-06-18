import { Router } from "express";
import { BannerController } from "../../controllers/client/Banner.controller";
import { optionalClientAuth } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();

const bannerCtrl =
    new BannerController();

router.use(rateLimiter.general);
router.use(optionalClientAuth);

router.get(
    "/",
    bannerCtrl.getActiveBanners.bind(
        bannerCtrl
    )
);

router.get(
    "/category/:category",
    bannerCtrl.getBannersByCategory.bind(
        bannerCtrl
    )
);

export default router;