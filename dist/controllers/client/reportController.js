"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientReportController = void 0;
const reportsServices_1 = require("../../services/client/reportsServices");
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const reportService = new reportsServices_1.ClientReportServices();
class ClientReportController {
    async uploadReport(req, res, next) {
        try {
            const report = await reportService.uploadReport(req.user.id, req.params.accountId, req.body);
            return (0, helpers_1.sendSuccessResponse)(res, report, "report uploaded successfully", constants_1.HTTP_STATUS.CREATED);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    async getMyReports(req, res, next) {
        try {
            const filters = req.query;
            const reports = await reportService.getMyReports(req.user.id, filters);
            return (0, helpers_1.sendSuccessResponse)(res, reports, "report history retrieved", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
}
exports.ClientReportController = ClientReportController;
