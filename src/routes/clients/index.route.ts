import { Router } from "express";
import oauthRoutes from './google.routes'
import authRoutes from './auth.route'
import profileRoutes from "./profile.routes"
//import subscriptionRoutes from "./subscription"
import accountRoutes from "./accounts.route"
import faqRoutes from './faq.routes'
//import bidRoutes from "./bid.routes"
//import assignmentRoutes from "./assignments.routes"
//import requestRoutes from "./request.routes"
import contactRoutes from "./contact"
import businessCategoryRoutes from "./businessCategory"
import enquiryRoutes from "./enquiries.route"
//import reportRoutes from "./reports.route"
import transactionRoutes from "./transactions.route"
import planRoutes from "./plan.routes"
// import dashBoardRoutes from "./dashboard"
import notificationRoutes from "./notification.routes"

const router = Router();

router.use('/oauth', oauthRoutes)
router.use('/auth', authRoutes)
router.use('/profile', profileRoutes)
//router.use('/subscription', subscriptionRoutes)
router.use('/account', accountRoutes)
router.use('/faqs', faqRoutes)
//router.use('/bid', bidRoutes)
//router.use('/assignments', assignmentRoutes)
//router.use("/requests", requestRoutes)
router.use("/contact", contactRoutes)
router.use("/business-category", businessCategoryRoutes)
router.use("/transactions", transactionRoutes)
router.use("/enquiries", enquiryRoutes)
//router.use("/reports", reportRoutes)
router.use("/plans", planRoutes)
// router.use("/dashboard", dashBoardRoutes)
router.use("/notifications", notificationRoutes)

export default router;  