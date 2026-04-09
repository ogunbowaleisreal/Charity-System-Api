import { AccountServices } from "../../services/client/accountServices";
import { Request, Response, NextFunction } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { AuthenticatedRequest } from "../../middleware/verifyClients";
import { AuthenticatedClientRequest } from "../../middleware/auth";

const accountService = new AccountServices();
export class AccountController {
    // private accountService: AccountServices;

    // constructor() {
    //     this.accountService = new AccountServices();
    // }

    // async getAllAccounts(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
    //     try {
    //         const accounts = await accountService.getAllAccounts();
    //         sendSuccessResponse(res, accounts, "accounts retrieved successfully", 200)
    //     } catch (error: any) {
    //         logger.error("account retrieval failed", error.message)
    //         //sendErrorResponse(res, error.message, 400)
    //         next(error)
    //     }
    // }

    async getUserAccount(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.user.userId;
            console.log(req.user)
            const account = await accountService.getAccount(accountId);
            //const { _id, firstName, lastName, email, phone, status } = account;
            return sendSuccessResponse(res, account, "account retrieved successfully", 200)
        } catch (error: any) {
            logger.error("account retrieval failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }
    // async getAccountById(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
    //     try {
    //         const accountId = req.params.id;
    //         const account = await accountService.getAccount(accountId);
    //         return sendSuccessResponse(res, account, "account retrieved successfully", 200)
    //     } catch (error: any) {
    //         logger.error("account retrieval failed", error.message)
    //         //sendErrorResponse(res, error.message, 400)
    //         next(error)
    //     }
    // }
}