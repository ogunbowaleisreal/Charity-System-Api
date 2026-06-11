"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFeeController = void 0;
const servicefee_services_1 = require("../../services/servicefee.services");
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const serviceFeeService = new servicefee_services_1.ServiceFeeService();
class ServiceFeeController {
    async getServiceFee(req, res, next) {
        try {
            const category = req.body.category;
            const serviceFee = await serviceFeeService.getAllActiveFee();
            return (0, helpers_1.sendSuccessResponse)(res, serviceFee);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.BAD_REQUEST);
        }
    }
    async updateServiceFee(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const type = req.body.type;
            const value = req.body.value;
            const category = req.body.category;
            const serviceFee = await serviceFeeService.updateServiceFee(category, type, value, adminId);
            return (0, helpers_1.sendSuccessResponse)(res, serviceFee);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.BAD_REQUEST);
        }
    }
}
exports.ServiceFeeController = ServiceFeeController;
