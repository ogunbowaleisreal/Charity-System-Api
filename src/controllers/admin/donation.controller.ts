import { DonationService } from "../../services/admin/donation.services";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { Request, Response, NextFunction } from "express";

const donationService = new DonationService();

export class DonationController {
    // =============================
    // 🔹 GET DONATION BY ID
    // =============================
    async getDonationById(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { donationId } = req.params;
            const donation = await donationService.getDonationById(donationId);
            return sendSuccessResponse(res, donation);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, error.statusCode);
        }
    }

    async getUserDonations(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {

        // const userId = req..userId;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        try {
            const donations = await donationService.getUserDonations(req.params.user_id, { page, limit });
            return sendSuccessResponse(res, donations);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, error.statusCode);
        }
    }
    // async getUserDonations(req: Request, res: Response) {
    //     const userId = req.user.id;

    //     const page = Number(req.query.page) || 1;
    //     const limit = Number(req.query.limit) || 10;

    //     const result = await donationService.getUserDonations(
    //         userId,
    //         {
    //             page,
    //             limit
    //         }
    //     );

    //     return res.status(200).json(result);
    // }
}