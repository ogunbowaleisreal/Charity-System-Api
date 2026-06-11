import { Router } from "express";
import oauthRoutes from './google.routes'
import authRoutes from './auth.route'
import profileRoutes from "./profile.routes"
//import subscriptionRoutes from "./subscription"
import accountRoutes from "./accounts.route"
import campaignRoutes from "./campaign.routes"
import donationRoutes from "./donation.routes"
import faqRoutes from './faq.routes'
import contactRoutes from "./contact"
import businessCategoryRoutes from "./campaignCategory"
import enquiryRoutes from "./enquiries.route"
import transactionRoutes from "./transactions.route"
import tagRoutes from "./tags.route"
import planRoutes from "./plan.routes"
import kycRoutes from "./Kyc.routes"
import gratuityRoutes from "./gratuity.routes"
import bankDetailsRoutes from "./bankDetails.routes"
import serviceFeeRoutes from "./serviceFee.routes"
// import dashBoardRoutes from "./dashboard"
import notificationRoutes from "./notification.routes"
import withdrawalRoutes from "./withdrawal.routes"
import bankRoutes from "./bank.routes"
const router = Router();

router.use('/oauth', oauthRoutes)
router.use('/auth', authRoutes)
router.use('/banks', bankRoutes)
router.use('/profile', profileRoutes)
//router.use('/subscription', subscriptionRoutes)
router.use('/account', accountRoutes)
router.use("/bank-details", bankDetailsRoutes)
router.use('/faqs', faqRoutes)
router.use('/campaign', campaignRoutes)
router.use('/donation', donationRoutes)
router.use("/faq", faqRoutes)
router.use("/gratuity", gratuityRoutes)
router.use("/kyc", kycRoutes)
router.use('/tags', tagRoutes)
router.use("/contact", contactRoutes)
router.use("/campaign-category", businessCategoryRoutes)
router.use("/transactions", transactionRoutes)
router.use("/enquiries", enquiryRoutes)
router.use("/plans", planRoutes)
router.use("/withdraw", withdrawalRoutes)
router.use("/service-fee", serviceFeeRoutes)
// router.use("/dashboard", dashBoardRoutes)
router.use("/notifications", notificationRoutes)

export default router;  