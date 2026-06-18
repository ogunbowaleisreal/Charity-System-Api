import { Router } from "express";
import { BannerAdminController } from "../../controllers/admin/Banner.controller";
import {
    verifyAdminToken,
    authorize,
} from "../../middleware/adminAuth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";

const router = Router();

const bannerCtrl =
    new BannerAdminController();

router.use(verifyAdminToken);
router.use(rateLimiter.general);

router.post(
    "/create",
    authorize([
        ADMIN_PERMISSIONS.BANNER?.CREATE,
    ]),
    bannerCtrl.createBanner.bind(bannerCtrl)
);

router.get(
    "/",
    authorize([
        ADMIN_PERMISSIONS.BANNER?.VIEW,
    ]),
    bannerCtrl.getAllBanners.bind(bannerCtrl)
);

router.get(
    "/:bannerId",
    authorize([
        ADMIN_PERMISSIONS.BANNER?.VIEW,
    ]),
    bannerCtrl.getBannerById.bind(bannerCtrl)
);

router.put(
    "/:bannerId",
    authorize([
        ADMIN_PERMISSIONS.BANNER?.UPDATE,
    ]),
    bannerCtrl.updateBanner.bind(bannerCtrl)
);

router.patch(
    "/activate/:bannerId",
    authorize([
        ADMIN_PERMISSIONS.BANNER?.UPDATE,
    ]),
    bannerCtrl.activateBanner.bind(bannerCtrl)
);

router.patch(
    "/deactivate/:bannerId",
    authorize([
        ADMIN_PERMISSIONS.BANNER?.UPDATE,
    ]),
    bannerCtrl.deactivateBanner.bind(bannerCtrl)
);

router.patch(
    "/order/:bannerId",
    authorize([
        ADMIN_PERMISSIONS.BANNER?.UPDATE,
    ]),
    bannerCtrl.updateBannerOrder.bind(bannerCtrl)
);

router.delete(
    "/:bannerId",
    authorize([
        ADMIN_PERMISSIONS.BANNER?.DELETE,
    ]),
    bannerCtrl.deleteBanner.bind(bannerCtrl)
);

export default router;