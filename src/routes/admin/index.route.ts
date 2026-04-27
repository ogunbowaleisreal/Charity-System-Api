import { Router } from "express";
import adminAuthRoute from './auth.route'
import managementRoutes from './admin.management.route'
import roleRoutes from "./rolesManagement"
import categoryRoutes from "./category"
import faqRoutes from "./faq"
//import accountRoutes from "./accountManagement"
//import requestRoutes from "./request.routes"
//import bidRoutes from "./bid"
//import assignmentRoutes from "./assignment.routes"
import profileRoutes from "./profile.routes"
import withdrawalManagementRoutes from "./withdrawal.routes"
import businessCategoryRoutes from "./businessCategoryManagement"
import contactRoutes from "./contact"
import mediaRoute from "./medis"
import enquiryRoutes from "./enquiries.routes"
import tagRoutes from "./tags.route"
import campaignRoutes from "./campaignManagement"
import notoficationRoutes from "./notification.routes"
//import reportRoutes from "./reports.route"
//import subscriptionManagementRoutes from "./subscriptionManagement"
import planRoutes from "./adminPlanManagement"
// import adminDashboardRoutes from "./adminDashboard"

const router = Router();

router.use('/auth', adminAuthRoute);
router.use('/management', managementRoutes);
// router.use('/dashboard', adminDashboardRoutes)
router.use('/roles', roleRoutes)
router.use('/category', categoryRoutes)
router.use('/faqs', faqRoutes)
router.use("/withdrawal", withdrawalManagementRoutes)
//router.use("/accounts", accountRoutes)
//router.use("/requests", requestRoutes)
//router.use("/bid", bidRoutes)
//router.use("/assignments", assignmentRoutes)
router.use("/business-category", businessCategoryRoutes)
router.use("/tags", tagRoutes)
router.use("/campaign", campaignRoutes)
router.use("/notification", notoficationRoutes)
//router.use("/subscription", subscriptionManagementRoutes)
router.use("/profile", profileRoutes)
router.use("/contact", contactRoutes)
router.use("/media", mediaRoute)
router.use("/enquiries", enquiryRoutes)
//router.use("/reports", reportRoutes)
router.use("/plan", planRoutes)


export default router;