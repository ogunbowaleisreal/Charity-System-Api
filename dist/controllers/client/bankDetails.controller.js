"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankDetailsController = void 0;
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const bank_details_services_1 = require("../../services/client/bank.details.services");
const bankDetailsService = new bank_details_services_1.BankDetailsService();
class BankDetailsController {
    // =============================
    // 🔹 CREATE
    // =============================
    async createBankDetails(req, res, next) {
        try {
            const bankDetails = await bankDetailsService.createBankDetails(req.body, req.user._id);
            return (0, helpers_1.sendSuccessResponse)(res, bankDetails);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =============================
    // 🔹 FETCH
    // =============================
    async getUserBankDetails(req, res, next) {
        try {
            const bankDetails = await bankDetailsService.getUserBankDetails(req.user._id);
            return (0, helpers_1.sendSuccessResponse)(res, bankDetails);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // async getBankDetailsById(
    //     req: Request,
    //     res: Response,
    //     next: NextFunction
    // ) {
    //     try {
    //         const { bankDetailsId } = req.params;
    //         const bankDetails =
    //             await bankDetailsService.getBankDetailsById(
    //                 bankDetailsId
    //             );
    //         return sendSuccessResponse(res, bankDetails);
    //     } catch (error: any) {
    //         logger.error(error);
    //         return sendErrorResponse(res, error);
    //     }
    // }
    // =============================
    // 🔹 UPDATE
    // =============================
    async updateBankDetails(req, res, next) {
        try {
            const { bankDetailsId } = req.params;
            const bankDetails = await bankDetailsService.updateBankDetails(bankDetailsId, req.user._id, req.body);
            return (0, helpers_1.sendSuccessResponse)(res, bankDetails);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
}
exports.BankDetailsController = BankDetailsController;
