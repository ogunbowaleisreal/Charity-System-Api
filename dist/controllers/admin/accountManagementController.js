"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountManagementController = void 0;
const accountManagementServices_1 = require("../../services/admin/accountManagementServices");
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const accountManagementService = new accountManagementServices_1.AccountAdminService();
class AccountManagementController {
    async getAllAccounts(req, res, next) {
        try {
            // console.log(req.query)
            const accountId = req.admin?.adminId;
            const accounts = await accountManagementService.getAllAccounts(req.query);
            return (0, helpers_1.sendSuccessResponse)(res, accounts, "accounts retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err);
        }
    }
    // async deleteAccount(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
    //     try {
    //         const accountId = req.admin?.adminId
    //         const deletedAccount = await accountManagementService.deleteAccount(req.params.accountId)
    //         return sendSuccessResponse(res, deletedAccount, "account deleted successfully", HTTP_STATUS.OK,)
    //     } catch (err: any) {
    //         logger.error(err.message)
    //         //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
    //         next(err)
    //     }
    // }
    async suspendAccount(req, res, next) {
        try {
            const accountId = req.admin?.adminId;
            const suspendedAccount = await accountManagementService.suspendAccount(req.params.account_id);
            return (0, helpers_1.sendSuccessResponse)(res, suspendedAccount, "account suspended successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err);
        }
    }
    async unsuspendAccount(req, res, next) {
        try {
            const accountId = req.admin?.adminId;
            const unsuspendedAccount = await accountManagementService.unsuspendAccount(req.params.account_id);
            return (0, helpers_1.sendSuccessResponse)(res, unsuspendedAccount, "account unsuspended successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err);
        }
    }
    async getAccountDetails(req, res, next) {
        try {
            const accountId = req.admin?.adminId;
            const account = await accountManagementService.getAccountById(req.params.account_id);
            return (0, helpers_1.sendSuccessResponse)(res, account, "account retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err);
        }
    }
    async getCampaignComments(req, res, next) {
        try {
            const accountId = req.admin?.adminId;
            const comments = await accountManagementService.getCampaignComments(req.params.campaign_id, req.query);
            return (0, helpers_1.sendSuccessResponse)(res, comments, "comments retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err);
        }
    }
    async getUserCampaigns(req, res, next) {
        try {
            const accountId = req.admin?.adminId;
            const campaigns = await accountManagementService.getUserCampaigns(req.params.account_id, req.query);
            return (0, helpers_1.sendSuccessResponse)(res, campaigns, "campaigns retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err);
        }
    }
    async getUserDonations(req, res, next) {
        try {
            const accountId = req.admin?.adminId;
            const donations = await accountManagementService.getUserDonations(req.params.account_id, req.query);
            return (0, helpers_1.sendSuccessResponse)(res, donations, "donations retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err);
        }
    }
    async getCampaignDonations(req, res, next) {
        try {
            const accountId = req.admin?.adminId;
            const donations = await accountManagementService.getCampaignDonations(req.params.campaign_id, req.query);
            return (0, helpers_1.sendSuccessResponse)(res, donations, "donations retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err);
        }
    }
    // async approveOrDeclineAccount(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
    //     try {
    //         const accountId = req.admin?.adminId
    //         const account = await accountManagementService.approveOrDeclineConsultant(req.params.consultant_id, req.body)
    //         return sendSuccessResponse(res, account, "account status updated successfully", HTTP_STATUS.OK,)
    //     } catch (err: any) {
    //         logger.error(err.message)
    //         //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
    //         next(err)
    //     }
    // }
    async getClientPaymentHistory(req, res, next) {
        try {
            const accountId = req.admin?.adminId;
            const paymentHistory = await accountManagementService.getUserTransactions(req.params.accountId, req.query);
            return (0, helpers_1.sendSuccessResponse)(res, paymentHistory, "payment history retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err);
        }
    }
}
exports.AccountManagementController = AccountManagementController;
