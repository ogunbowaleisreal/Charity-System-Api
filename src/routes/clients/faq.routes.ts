import Router from "express"
//import { validateRequest } from "../../middleware/validation"
import { rateLimiter } from "../../middleware/ratelimiter"
//import { faqQueryValidation } from "@/validations/admin/faqValidation"
import { FAQController } from "../../controllers/client/faqController"
import { verifyClientToken } from "../../middleware/auth"


const faqController = new FAQController
const router = Router()

router.use(rateLimiter.general)
//router.use(verifyClientToken)
router.get("/",
    //validateRequest(faqQueryValidation),
    faqController.getAllFAQs
)
export default router