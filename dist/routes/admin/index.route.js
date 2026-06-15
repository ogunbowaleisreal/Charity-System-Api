"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = __importDefault(require("./auth.route"));
const admin_management_route_1 = __importDefault(require("./admin.management.route"));
const rolesManagement_1 = __importDefault(require("./rolesManagement"));
const category_1 = __importDefault(require("./category"));
const faq_1 = __importDefault(require("./faq"));
const accountManagement_1 = __importDefault(require("./accountManagement"));
const announcement_routes_1 = __importDefault(require("./announcement.routes"));
const comments_route_1 = __importDefault(require("./comments.route"));
//import requestRoutes from "./request.routes"
//import bidRoutes from "./bid"
//import assignmentRoutes from "./assignment.routes"
const profile_routes_1 = __importDefault(require("./profile.routes"));
const withdrawal_routes_1 = __importDefault(require("./withdrawal.routes"));
const donations_routes_1 = __importDefault(require("./donations.routes"));
const businessCategoryManagement_1 = __importDefault(require("./businessCategoryManagement"));
const contact_1 = __importDefault(require("./contact"));
const medis_1 = __importDefault(require("./medis"));
const enquiries_routes_1 = __importDefault(require("./enquiries.routes"));
const tags_route_1 = __importDefault(require("./tags.route"));
const campaignManagement_1 = __importDefault(require("./campaignManagement"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const gratuity_routes_1 = __importDefault(require("./gratuity.routes"));
const withdrawal_routes_2 = __importDefault(require("./withdrawal.routes"));
const transaction_management_1 = __importDefault(require("./transaction.management"));
const kyc_routes_1 = __importDefault(require("./kyc.routes"));
const service_fee_routes_1 = __importDefault(require("./service.fee.routes"));
//import reportRoutes from "./reports.route"
//import subscriptionManagementRoutes from "./subscriptionManagement"
const adminPlanManagement_1 = __importDefault(require("./adminPlanManagement"));
const dashboardStatistics_1 = __importDefault(require("./dashboardStatistics"));
const router = (0, express_1.Router)();
router.use('/auth', auth_route_1.default);
router.use('/announcement', announcement_routes_1.default);
router.use('/management', admin_management_route_1.default);
router.use('/dashboard', dashboardStatistics_1.default);
router.use('/roles', rolesManagement_1.default);
router.use('/category', category_1.default);
router.use('/faqs', faq_1.default);
router.use("/withdrawal", withdrawal_routes_1.default);
router.use("/gratuity", gratuity_routes_1.default);
router.use("/kyc", kyc_routes_1.default);
router.use("/accounts", accountManagement_1.default);
router.use("/comments", comments_route_1.default);
router.use("/donation", donations_routes_1.default);
//router.use("/requests", requestRoutes)
//router.use("/bid", bidRoutes)
//router.use("/assignments", assignmentRoutes)
router.use("/business-category", businessCategoryManagement_1.default);
router.use("/service-fee", service_fee_routes_1.default);
router.use("/transactions", transaction_management_1.default);
router.use("/tags", tags_route_1.default);
router.use("/campaign", campaignManagement_1.default);
router.use("/notification", notification_routes_1.default);
router.use("/withdrawal", withdrawal_routes_2.default);
//router.use("/subscription", subscriptionManagementRoutes)
router.use("/profile", profile_routes_1.default);
router.use("/contact", contact_1.default);
router.use("/media", medis_1.default);
router.use("/enquiries", enquiries_routes_1.default);
//router.use("/reports", reportRoutes)
router.use("/plan", adminPlanManagement_1.default);
exports.default = router;
