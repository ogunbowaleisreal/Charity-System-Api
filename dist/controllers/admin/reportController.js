"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminReportController = void 0;
const reportServices_1 = require("../../services/admin/reportServices");
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const reportService = new reportServices_1.AdminReportServices();
class AdminReportController {
    async getReports(req, res, next) {
        try {
            const reports = await reportService.getReports(req.query);
            return (0, helpers_1.sendSuccessResponse)(res, reports, "reports retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    async getComplains(req, res, next) {
        try {
            const reports = await reportService.getComplains(req.query);
            return (0, helpers_1.sendSuccessResponse)(res, reports, "complains retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
}
exports.AdminReportController = AdminReportController;
