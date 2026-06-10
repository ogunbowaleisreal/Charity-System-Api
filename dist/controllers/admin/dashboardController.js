"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const dashboardStatistics_1 = require("../../services/admin/dashboardStatistics");
class DashboardController {
    constructor() {
        this.dashboardService = new dashboardStatistics_1.DashboardService();
        this.getDashboardStats = async (req, res) => {
            try {
                const result = await this.dashboardService.getDashboardStats();
                (0, helpers_1.sendSuccessResponse)(res, result, "Dashboard statistics retrieved successfully");
                logger_1.default.info("Admin retrieved dashboard statistics", {
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                });
            }
            catch (error) {
                logger_1.default.error("Failed to retrieve dashboard statistics", {
                    error: error.message,
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
    }
}
exports.DashboardController = DashboardController;
