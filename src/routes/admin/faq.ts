import { Router } from "express";
// import { validateRequest } from "@/middleware/validation";
import { rateLimiter } from "../../middleware/ratelimiter";
// import {
//     createFAQValidation,
//     updateFAQValidation,
//     faqQueryValidation,
// } from "@/validations/admin/faqValidation";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import {
    authorize,
    requireRole,
    verifyAdminToken,
} from "../../middleware/adminAuth";
import { FAQController } from "../../controllers/admin/faqController";

const router = Router();
const faqController = new FAQController();

router.use(verifyAdminToken as any);
router.use(rateLimiter.general);

router.get(
    "/",
    authorize([ADMIN_PERMISSIONS.FAQS.VIEW]) as any,
    //validateRequest(faqQueryValidation),
    faqController.getAllFAQs as any
);

// Get FAQ statistics/analytics
// router.get(
//     "/statistics",
//     requireRole(["admin", "super_admin"]) as any,
//     authorize([ADMIN_PERMISSIONS.DASHBOARD.VIEW_FAQS_STATS]) as any,
//     faqController.getFAQStatistics as any
// );

// // Get FAQs by category
// router.get(
//     "/categories",
//     authorize([ADMIN_PERMISSIONS.FAQS.VIEW]) as any,
//     faqController.getFAQCategories as any
// );

// Get specific FAQ by ID
router.get(
    "/:id",
    authorize([ADMIN_PERMISSIONS.FAQS.VIEW]) as any,
    faqController.getFAQById as any
);

// Create new FAQ
router.post(
    "/",
    authorize([ADMIN_PERMISSIONS.FAQS.CREATE]) as any,
    //validateRequest(createFAQValidation),
    faqController.createFAQ as any
);

// Update FAQ
router.put(
    "/:id",
    authorize([ADMIN_PERMISSIONS.FAQS.UPDATE]) as any,
    //validateRequest(updateFAQValidation),
    faqController.updateFAQ as any
);

// Delete FAQ
router.delete(
    "/:id",
    authorize([ADMIN_PERMISSIONS.FAQS.DELETE]) as any,
    faqController.deleteFAQ as any
);

export default router;
