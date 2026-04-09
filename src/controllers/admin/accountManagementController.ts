import e, { Request, Response, NextFunction } from "express";
import { AccountManagementServices } from "../../services/admin/accountManagementServices";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { Account } from "../../models/Accounts";

const accountManagementService = new AccountManagementServices()

export class AccountManagementController {
    async getAllAccounts(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            // console.log(req.query)
            const accountId = req.admin?.adminId
            const accounts = await accountManagementService.getAllAccounts(req.query)
            return sendSuccessResponse(res, accounts, "accounts retrieved successfully", HTTP_STATUS.OK,)
        } catch (err: any) {
            logger.error(err.message)
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err)
        }
    }

    async deleteAccount(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.admin?.adminId
            const deletedAccount = await accountManagementService.deleteAccount(req.params.accountId)
            return sendSuccessResponse(res, deletedAccount, "account deleted successfully", HTTP_STATUS.OK,)
        } catch (err: any) {
            logger.error(err.message)
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err)
        }
    }

    async suspendAccount(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.admin?.adminId
            const suspendedAccount = await accountManagementService.suspendAccount(req.params.account_id)
            return sendSuccessResponse(res, suspendedAccount, "account suspended successfully", HTTP_STATUS.OK,)
        } catch (err: any) {
            logger.error(err.message)
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err)
        }
    }

    async unsuspendAccount(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.admin?.adminId
            const unsuspendedAccount = await accountManagementService.unSuspendAccount(req.params.account_id)
            return sendSuccessResponse(res, unsuspendedAccount, "account unsuspended successfully", HTTP_STATUS.OK,)
        } catch (err: any) {
            logger.error(err.message)
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err)
        }
    }

    async getAccountDetails(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.admin?.adminId
            const account = await accountManagementService.getAccountById(req.params.account_id)
            return sendSuccessResponse(res, account, "account retrieved successfully", HTTP_STATUS.OK,)
        } catch (err: any) {
            logger.error(err.message)
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err)
        }
    }

    async approveOrDeclineAccount(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.admin?.adminId
            const account = await accountManagementService.approveOrDeclineConsultant(req.params.consultant_id, req.body)
            return sendSuccessResponse(res, account, "account status updated successfully", HTTP_STATUS.OK,)
        } catch (err: any) {
            logger.error(err.message)
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err)
        }
    }

    async getClientPaymentHistory(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.admin?.adminId
            const paymentHistory = await accountManagementService.getClientPaymentHistory(req.params.accountId)
            return sendSuccessResponse(res, paymentHistory, "payment history retrieved successfully", HTTP_STATUS.OK,)
        } catch (err: any) {
            logger.error(err.message)
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err)
        }
    }

    async assignConsultant(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId
            const assignment = await accountManagementService.assignConsultant(req.params.client_id, req.body.consultantId, req.body.requestId, req.body.assignmentType)
            return sendSuccessResponse(res, assignment, "consultant assigned successfully, email sent to client", HTTP_STATUS.OK)
        } catch (err: any) {
            logger.error(err.message)
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err)
        }
    }

    async updateProfile(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.params.accountId

            const account = await Account.findById(accountId)
            if (!account) throw new Error("Account not found")
            const role = account.role
            const profile = await accountManagementService.updateProfile(accountId, req.body, role)
            return sendSuccessResponse(res, profile, "profile updated successfully", HTTP_STATUS.OK)
        } catch (err: any) {
            logger.error(err.message)
            //return sendErrorResponse(res,"", HTTP_STATUS.INTERNAL_SERVER_ERROR, err)
            next(err)
        }
    }


}