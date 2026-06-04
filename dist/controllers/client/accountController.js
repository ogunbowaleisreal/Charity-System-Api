"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const accountServices_1 = require("../../services/client/accountServices");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const accountService = new accountServices_1.AccountServices();
class AccountController {
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
    async getUserAccount(req, res, next) {
        try {
            const accountId = req.user.userId;
            console.log(req.user);
            const account = await accountService.getAccount(accountId);
            //const { _id, firstName, lastName, email, phone, status } = account;
            return (0, helpers_1.sendSuccessResponse)(res, account, "account retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error("account retrieval failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
}
exports.AccountController = AccountController;
