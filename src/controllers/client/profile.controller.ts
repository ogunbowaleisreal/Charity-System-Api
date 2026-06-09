import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";
import { clientProfileServices } from "../../services/client/clientProfile.services";
//import { AuthenticatedRequest } from "../../middleware/verifyClients";
import logger from "../../logger";
import { authService } from "../../services/client/Auth.services";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { HTTP_STATUS } from "../../utils/constants";
import OTPService from "../../services/otp.services";
import { Account } from "../../models/Accounts";
import { success } from "zod";


const clientServices = new clientProfileServices()
const authServices = new authService()
const otpService = new OTPService()
export class profileController {



    async updateClientProfile(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {

            const accountId = req.user?.userId
            const role = req.user?.role
            console.log(role)


            const update = await clientServices.updateClientProfile(accountId, req.body)
            //console.log(update)
            if (update) {
                logger.info("profile updated successfully")
                return sendSuccessResponse(res, update, "profile updated successfully", 200)
            }
            sendErrorResponse(res, "update failed", 403)

        } catch (err) {
            logger.error("update failed",)
            sendErrorResponse(res, "update failed", 403)
            next(err)
            //sendErrorResponse(res, "update failed", 403)
        }

    }



    async deleteAccount(req: AuthenticatedClientRequest, res: Response) {
        try {
            const { password, reason } = req.body;
            const userId = req.user?.userId

            if (!password) {
                return res.status(400).json({ message: "Passsword is required" });
            }
            const response = await clientServices.deleteAccount(userId, password, reason);
            if (!response) {
                return res.status(400).json({ message: "Account not found" });
            }
            return sendSuccessResponse(res, { message: "Account deleted Successfully", success: true }, "Account deleted Successfully", HTTP_STATUS.OK)

        } catch (err: any) {
            sendErrorResponse(res, err.message, err.statusCode)
            //return res.status(500).json({ message: "Internal Server Error", error: err })
        }
    }
    async verifyAccountDeletionOtp(req: AuthenticatedClientRequest, res: Response) {
        try {
            const { email, otp, reason } = req.body;
            const accountId = req.user?.userId
            if (!email || !otp) {
                return res.status(400).json({ message: "Email and otp is required" });
            }
            const deleted = await clientServices.deleteAccount2FA(accountId, otp, reason)

            if (deleted) {
                sendSuccessResponse(res, deleted, "account deleted successfully", HTTP_STATUS.OK)
            }

        } catch (err: any) {
            sendErrorResponse(res, err.message, err.statusCode)
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

    async changePassword(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            //const { email } = req.body;
            const userId = req.user.userId
            const account = await Account.findById(userId)
            if (!account) {
                throw new Error("error retrieving user account")
            }

            await otpService.generateAndSendOTP(account.email, "password_reset");
            return res.status(200).json({ message: "OTP sent to email" });
        } catch (err) {
            logger.error("otp request failed")
            next(err)
        }
    }

    async verifyPasswordResetOtp(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const { otp } = req.body;
            if (!otp) {
                return res.status(400).json({ message: "Email and OTP are required" });
            }

            const userId = req.user.userId
            const account = await Account.findById(userId)
            if (!account) {
                throw new Error("error retrieving user account")
            }
            const response = await authServices.verifyPasswordResetOTP(account.email, otp);
            if (!response) {
                throw new Error("Password reset failed")
            }
            logger.info("password reset OTP verified successfully",)
            return res.status(200).json({ message: "Password reset OTP verified successfully" });
        } catch (err: any) {
            logger.error("password reset OTP error", err)
            sendErrorResponse(res, err.message, err.statusCode)
            next(err)
            //return res.status(500).json({ message: "Internal Server Error", error: err })
        }
    }

    async verifyAndResetPassword(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const { newPassword } = req.body;
            if (!newPassword) {
                return res.status(400).json({ message: "Email, OTP and new password are required" });
            }

            const userId = req.user.userId
            const account = await Account.findById(userId)
            if (!account) {
                throw new Error("error retrieving user account")
            }
            const response = await authServices.verifyAndResetPassword(account.email, newPassword);
            if (!response) {
                throw new Error("Password reset failed")
            }
            logger.info("password reset successful",)
            return res.status(200).json({ message: "Password reset successful" });
        } catch (err: any) {
            logger.error("password reset error", err)
            sendErrorResponse(res, err.message, err.statusCode)
            next(err)
            //return res.status(500).json({ message: "Internal Server Error", error: err }) 
        }
    }

    async toggle2FA(req: AuthenticatedClientRequest, res: Response) {
        try {
            const { enabled } = req.body;
            const userId = req.user.userId

            if (!userId) {
                sendErrorResponse(
                    res,
                    "Must be logged in to perform this action",
                    HTTP_STATUS.UNAUTHORIZED
                );
                return;
            }

            let result;
            if (enabled) {
                result = await clientServices.enableTwoFactorAuth(userId);
            } else {
                result = await clientServices.disableTwoFactorAuth(userId);
            }

            sendSuccessResponse(res, { twoFactorEnabled: enabled, user: result.account }, result.message);
        } catch (error: any) {
            logger.error("Toggle 2FA error", {
                message: error.message,
                statusCode: error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });

            sendErrorResponse(
                res,
                error.message,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,

            );
        }
    }




    async getClientProfile(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const clientId = req.user.userId
            const role = req.user.role

            const profile = await clientServices.getClientProfile(clientId)
            sendSuccessResponse(res, profile, " profile fetched ")
        } catch (err: any) {
            logger.error("profile fetch failed")
            next(err)
        }
    }


}
