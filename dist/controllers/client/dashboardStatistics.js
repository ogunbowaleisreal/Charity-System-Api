"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const dashboard_service_1 = require("../../services/client/dashboard.service");
const dashoardService = new dashboard_service_1.ClientDashboardService();
class DashboardController {
    async getDashboard(req, res) {
        try {
            const userId = req.user.userId;
            const stats = await dashoardService.getDashboardStats(userId);
            logger_1.default.info("Dashboard statistics fetched successfully");
            (0, helpers_1.sendSuccessResponse)(res, stats, "Dashboard statistics fetched successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (error) {
            logger_1.default.error("Dashboard statistics fetch failed", error.message);
            (0, helpers_1.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        //res.json({ role, stats });
    }
}
exports.DashboardController = DashboardController;
