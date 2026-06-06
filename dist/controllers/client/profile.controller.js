"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileController = void 0;
const clientProfile_services_1 = require("../../services/client/clientProfile.services");
//import { AuthenticatedRequest } from "../../middleware/verifyClients";
const logger_1 = __importDefault(require("../../logger"));
const Auth_services_1 = require("../../services/client/Auth.services");
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const otp_services_1 = __importDefault(require("../../services/otp.services"));
const Accounts_1 = require("../../models/Accounts");
const clientServices = new clientProfile_services_1.clientProfileServices();
const authServices = new Auth_services_1.authService();
const otpService = new otp_services_1.default();
class profileController {
    async updateClientProfile(req, res, next) {
        try {
            const accountId = req.user?.userId;
            const role = req.user?.role;
            console.log(role);
            const update = await clientServices.updateClientProfile(accountId, req.body);
            //console.log(update)
            if (update) {
                logger_1.default.info("profile updated successfully");
                return (0, helpers_1.sendSuccessResponse)(res, update, "profile updated successfully", 200);
            }
            (0, helpers_1.sendErrorResponse)(res, "update failed", 403);
        }
        catch (err) {
            logger_1.default.error("update failed");
            (0, helpers_1.sendErrorResponse)(res, "update failed", 403);
            next(err);
            //sendErrorResponse(res, "update failed", 403)
        }
    }
    async deleteAccount(req, res) {
        try {
            const { password, reason } = req.body;
            const userId = req.user?.userId;
            if (!password) {
                return res.status(400).json({ message: "Passsword is required" });
            }
            const response = await clientServices.deleteAccount(userId, password, reason);
            if (!response) {
                return res.status(400).json({ message: "Account not found" });
            }
            return (0, helpers_1.sendSuccessResponse)(res, { message: "Account deleted Successfully", success: true }, "Account deleted Successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode);
            //return res.status(500).json({ message: "Internal Server Error", error: err })
        }
    }
    async verifyAccountDeletionOtp(req, res) {
        try {
            const { email, otp, reason } = req.body;
            const accountId = req.user?.userId;
            if (!email || !otp) {
                return res.status(400).json({ message: "Email and otp is required" });
            }
            const deleted = await clientServices.deleteAccount2FA(accountId, otp, reason);
            if (deleted) {
                (0, helpers_1.sendSuccessResponse)(res, deleted, "account deleted successfully", constants_1.HTTP_STATUS.OK);
            }
        }
        catch (err) {
            (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode);
        }
    }
    // async changePassword(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
    //     try {
    //         const accountId = req.user.userId
    //         const { oldPassword, newPassword } = req.body
    //         const passwordUpdate = await authServices.changePassword(accountId, oldPassword, newPassword)
    //         if (!passwordUpdate) {
    //             //sendErrorResponse(res, "password change failed")
    //             throw new Error("password change failed")
    //         }
    //         sendSuccessResponse(res, { success: true }, "password changed successfully", 200)
    //     } catch (err: any) {
    //         logger.error("password change failed", err.message)
    //         //sendErrorResponse(res, err.message, err.statusCode)
    //         next(err)
    //     }
    // }
    async changePassword(req, res, next) {
        try {
            //const { email } = req.body;
            const userId = req.user.userId;
            const account = await Accounts_1.Account.findById(userId);
            if (!account) {
                throw new Error("error retrieving user account");
            }
            await otpService.generateAndSendOTP(account.email, "password_reset");
            return res.status(200).json({ message: "OTP sent to email" });
        }
        catch (err) {
            logger_1.default.error("otp request failed");
            next(err);
        }
    }
    async verifyPasswordResetOtp(req, res, next) {
        try {
            const { otp } = req.body;
            if (!otp) {
                return res.status(400).json({ message: "Email and OTP are required" });
            }
            const userId = req.user.userId;
            const account = await Accounts_1.Account.findById(userId);
            if (!account) {
                throw new Error("error retrieving user account");
            }
            const response = await authServices.verifyPasswordResetOTP(account.email, otp);
            if (!response) {
                throw new Error("Password reset failed");
            }
            logger_1.default.info("password reset OTP verified successfully");
            return res.status(200).json({ message: "Password reset OTP verified successfully" });
        }
        catch (err) {
            logger_1.default.error("password reset OTP error", err);
            (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode);
            next(err);
            //return res.status(500).json({ message: "Internal Server Error", error: err })
        }
    }
    async verifyAndResetPassword(req, res, next) {
        try {
            const { newPassword } = req.body;
            if (!newPassword) {
                return res.status(400).json({ message: "Email, OTP and new password are required" });
            }
            const userId = req.user.userId;
            const account = await Accounts_1.Account.findById(userId);
            if (!account) {
                throw new Error("error retrieving user account");
            }
            const response = await authServices.verifyAndResetPassword(account.email, newPassword);
            if (!response) {
                throw new Error("Password reset failed");
            }
            logger_1.default.info("password reset successful");
            return res.status(200).json({ message: "Password reset successful" });
        }
        catch (err) {
            logger_1.default.error("password reset error", err);
            (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode);
            next(err);
            //return res.status(500).json({ message: "Internal Server Error", error: err }) 
        }
    }
    async toggle2FA(req, res) {
        try {
            const { enabled } = req.body;
            const userId = req.user.userId;
            if (!userId) {
                (0, helpers_1.sendErrorResponse)(res, "Must be logged in to perform this action", constants_1.HTTP_STATUS.UNAUTHORIZED);
                return;
            }
            let result;
            if (enabled) {
                result = await clientServices.enableTwoFactorAuth(userId);
            }
            else {
                result = await clientServices.disableTwoFactorAuth(userId);
            }
            (0, helpers_1.sendSuccessResponse)(res, { twoFactorEnabled: enabled }, result.message);
        }
        catch (error) {
            logger_1.default.error("Toggle 2FA error", {
                message: error.message,
                statusCode: error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
            (0, helpers_1.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async getClientProfile(req, res, next) {
        try {
            const clientId = req.user.userId;
            const role = req.user.role;
            const profile = await clientServices.getClientProfile(clientId);
            (0, helpers_1.sendSuccessResponse)(res, profile, " profile fetched ");
        }
        catch (err) {
            logger_1.default.error("profile fetch failed");
            next(err);
        }
    }
}
exports.profileController = profileController;
