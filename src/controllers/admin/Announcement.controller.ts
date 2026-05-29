import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { Request, Response, NextFunction } from "express";
import logger from "../../logger";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { AnnouncementService } from "../../services/announcements.services";

const announcementService = new AnnouncementService()
export class AnnounceController {


    async createAnnouncement(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId
            const payload = { ...req.body, createdBy: adminId }
            const response = await announcementService.createAnnouncement(payload)
            logger.info("Announcement sending ....")
            if (response) {
                logger.info("announcement completed")
                sendSuccessResponse(res, response, "announcement completed", 201)
            }
        } catch (err: any) {
            logger.info("Announcement failed")
            sendErrorResponse(res, err.message, err.statusCode)
        }
    }

    async resendAnnouncement(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const response = await announcementService.resendAnnouncement(req.params.announcementId)
            logger.info("Announcement sending ....")
            if (response) {
                logger.info("announcement completed")
                sendSuccessResponse(res, response, "announcement completed", 201)
            }
        } catch (err: any) {
            logger.info("Announcement failed")
            sendErrorResponse(res, err.message, err.statusCode)
        }
    }

    async deleteAnnouncement(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const response = await announcementService.deleteAnnouncement(req.params.announcementId)
            logger.info("Announcement deleting ....")
            if (response) {
                logger.info("announcement completed")
                sendSuccessResponse(res, response, "announcement completed", 201)
            }
        } catch (err: any) {
            logger.info("Announcement failed")
            sendErrorResponse(res, err.message, err.statusCode)
        }
    }

    async getAllAnnouncements(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const response = await announcementService.getAllAnnouncements(req.query)
            logger.info("Announcement getting ....")
            if (response) {
                logger.info("announcement completed")
                sendSuccessResponse(res, response, "announcement completed", 201)
            }
        } catch (err: any) {
            logger.info("Announcement failed")
            sendErrorResponse(res, err.message, err.statusCode)
        }
    }
}