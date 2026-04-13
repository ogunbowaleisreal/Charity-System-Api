import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";
import { clientProfileServices } from "../../services/client/clientProfile.services";
//import { AuthenticatedRequest } from "../../middleware/verifyClients";
import logger from "../../logger";
import { authService } from "../../services/client/Auth.services";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { th } from "zod/v4/locales";


const clientServices = new clientProfileServices()
const authServices = new authService()
export class profileController {

    async updateClientProfile(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            // const { workEmail,
            //     workPhone,
            //     workType,
            //     positionInCompany,
            //     businessAddress,
            //     operatingCity,
            //     operatingCountry,
            //     operatingState,

            // } = req.body
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

    async changePassword(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {

        try {
            const accountId = req.user.userId
            const { oldPassword, newPassword } = req.body
            const passwordUpdate = await authServices.changePassword(accountId, oldPassword, newPassword)
            if (!passwordUpdate) {
                //sendErrorResponse(res, "password change failed")
                throw new Error("password change failed")
            }
            sendSuccessResponse(res, { success: true }, "password changed successfully", 200)
        } catch (err: any) {
            logger.error("password change failed", err.message)
            //sendErrorResponse(res, err.message, err.statusCode)
            next(err)
        }
    }

    async getClientProfile(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const clientId = req.user.userId
            const role = req.user.role

            const profile = await clientServices.getClientProfile(clientId)
            sendSuccessResponse(res, profile, "profile fetched")
        } catch (err: any) {
            logger.error("profile fetch failed")
            next(err)
        }
    }


}
