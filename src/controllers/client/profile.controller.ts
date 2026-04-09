import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";
import { clientProfileServices } from "../../services/client/clientProfile.services";
import { ConsultantProfileServices } from "../../services/client/consultantProfileServices";
//import { AuthenticatedRequest } from "../../middleware/verifyClients";
import logger from "../../logger";
import { authService } from "../../services/client/Auth.services";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { th } from "zod/v4/locales";


const clientServices = new clientProfileServices()
const authServices = new authService()
const consultantServices = new ConsultantProfileServices()
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
            if (role == "client") {

                const update = await clientServices.updateClientProfile(accountId, req.body)
                //console.log(update)
                if (update) {
                    logger.info("profile updated successfully")
                    return sendSuccessResponse(res, update, "profile updated successfully", 200)
                }
                sendErrorResponse(res, "update failed")

            }

            const update = await clientServices.updateClientProfile(accountId, req.body)
            console.log(update)
            if (update) {
                logger.info("profile updated successfully")
                return sendSuccessResponse(res, update, "profile updated successfully", 200)
            }
            sendErrorResponse(res, "update failed")

        } catch (err) {
            logger.error("update failed",)
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
            if (role !== "client") {
                throw new Error("unauthorized")
            }
            const profile = await clientServices.getClientProfile(clientId)
            sendSuccessResponse(res, profile, "profile fetched")
        } catch (err: any) {
            logger.error("profile fetch failed")
            next(err)
        }
    }

    async getConsultantProfile(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const clientId = req.user.userId
            const role = req.user.role
            console.log(clientId, role)
            if (role !== "consultant") {
                throw new Error("unauthorized, u are not a consultant")
            }
            const profile = await consultantServices.getConsultantProfile(clientId)
            sendSuccessResponse(res, profile, "profile fetched")
        } catch (err: any) {
            logger.error("profile fetch failed",)
            next(err)
        }
    }

    async updateConsultantProfile(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const clientId = req.user.userId
            const role = req.user.role
            console.log(role)
            if (role !== "consultant") {
                throw new Error("unauthorized")
            }
            const profile = await consultantServices.updateConsultantProfile(clientId, req.body)
            sendSuccessResponse(res, profile, "profile updated")
        } catch (err: any) {
            logger.error("profile fetch failed",)
            next(err)
        }
    }

    async deleteEducation(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const clientId = req.user.userId
            const educationId = req.params.educationId
            const role = req.user.role
            console.log(role)
            if (role !== "consultant") {
                throw new Error("unauthorized")
            }
            const profile = await consultantServices.deleteEducation(clientId, educationId)
            sendSuccessResponse(res, profile, "education deleted")
        } catch (error: any) {
            logger.error("delete education failed", error.message)
            sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async deleteCertificate(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const clientId = req.user.userId
            const certificateId = req.params.certificateId
            const role = req.user.role
            console.log(role)
            if (role !== "consultant") {
                throw new Error("unauthorized")
            }
            const profile = await consultantServices.deleteCertificate(clientId, certificateId)
            sendSuccessResponse(res, profile, "certificate deleted")
        } catch (error: any) {
            logger.error("delete certificate failed", error.message)
            sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    // async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    //     try {
    //         const clientId = req.user.user_id
    //         const profile = await clientServices.getClientProfile(clientId)
    //         sendSuccessResponse(res, profile, "profile fetched")
    //     } catch (err: any) {
    //         logger.error("profile fetch failed",)
    //         next(err)
    //     }
    // }


}
