import { Router } from "express";
import adminAuthRoute from './auth.route'
import managementRoutes from './admin.management.route'
import roleRoutes from "./rolesManagement"
import categoryRoutes from "./category"
import faqRoutes from "./faq"
import accountRoutes from "./accountManagement"
import announcementRoutes from "./announcement.routes"
import commentRoutes from "./comments.route"
//import requestRoutes from "./request.routes"
//import bidRoutes from "./bid"
//import assignmentRoutes from "./assignment.routes"
import profileRoutes from "./profile.routes"
import withdrawalManagementRoutes from "./withdrawal.routes"
import donationRoutes from "./donations.routes"
import campaignCategoryRoutes from "./campaignCategoryManagement"
import contactRoutes from "./contact"
import mediaRoute from "./medis"
import enquiryRoutes from "./enquiries.routes"
import tagRoutes from "./tags.route"
import campaignRoutes from "./campaignManagement"
import notoficationRoutes from "./notification.routes"
import gratuityRoutes from "./gratuity.routes"
import withdrawalRoutes from "./withdrawal.routes"
import transactionRoutes from "./transaction.management"
import kycRoutes from "./kyc.routes"
import serviceFeeRoutes from "./service.fee.routes"
import bannerRoutes from "./banner.routes"
import blogRoutes from "./blog.router"
//import reportRoutes from "./reports.route"
//import subscriptionManagementRoutes from "./subscriptionManagement"
import planRoutes from "./adminPlanManagement"
import adminDashboardRoutes from "./dashboardStatistics"

const router = Router();

router.use('/auth', adminAuthRoute);
router.use('/announcement', announcementRoutes)
router.use('/management', managementRoutes);
router.use("/blogs", blogRoutes)
router.use('/dashboard', adminDashboardRoutes)
router.use('/roles', roleRoutes)
router.use('/category', categoryRoutes)
router.use('/faqs', faqRoutes)
router.use("/withdrawal", withdrawalManagementRoutes)
router.use("/gratuity", gratuityRoutes)
router.use("/kyc", kycRoutes)
router.use("/accounts", accountRoutes)
router.use("/comments", commentRoutes)
router.use("/donation", donationRoutes)
router.use("/banner", bannerRoutes)
//router.use("/requests", requestRoutes)
//router.use("/bid", bidRoutes)
//router.use("/assignments", assignmentRoutes)
router.use("/campaign-category", campaignCategoryRoutes)
router.use("/service-fee", serviceFeeRoutes)
router.use("/transactions", transactionRoutes)
router.use("/tags", tagRoutes)
router.use("/campaign", campaignRoutes)
router.use("/notification", notoficationRoutes)
router.use("/withdrawal", withdrawalRoutes)
//router.use("/subscription", subscriptionManagementRoutes)
router.use("/profile", profileRoutes)
router.use("/contact", contactRoutes)
router.use("/media", mediaRoute)
router.use("/enquiries", enquiryRoutes)
//router.use("/reports", reportRoutes)
router.use("/plan", planRoutes)


export default router;