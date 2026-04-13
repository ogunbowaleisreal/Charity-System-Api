import Router from "express";
import { rateLimiter } from "../../middleware/ratelimiter";
import { sanitizeInput } from "../../middleware/sanitizer";
import { verifyAdminToken, authorize } from "../../middleware/adminAuth";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { TagController } from "../../controllers/admin/tags.controller";

const router = Router();
const tagController = new TagController();

router.use(rateLimiter.general as any);
router.use(verifyAdminToken as any);

router.post(
    "/",
    authorize([ADMIN_PERMISSIONS.TAG.CREATE]) as any,
    sanitizeInput,
    tagController.createTag as any
);

router.get(
    "/",
    authorize([ADMIN_PERMISSIONS.TAG.VIEW]) as any,
    sanitizeInput,
    tagController.getAllTags as any
);

router.get(
    "/:tagId",
    authorize([ADMIN_PERMISSIONS.TAG.VIEW]) as any,
    sanitizeInput,
    tagController.getTagById as any
);

router.patch(
    "/:tagId",
    authorize([ADMIN_PERMISSIONS.TAG.UPDATE]) as any,
    sanitizeInput,
    tagController.updateTag as any
);

router.delete(
    "/:tagId",
    authorize([ADMIN_PERMISSIONS.TAG.DELETE]) as any,
    sanitizeInput,
    tagController.deleteTag as any
);

export default router;
