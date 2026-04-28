import { Request, Response, NextFunction } from "express";
import logger from "../../logger";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { UserGratuityService } from "../../services/client/gratuity.services";

const userGratuityService = new UserGratuityService();

export class UserGratuityController {

    // =========================
    // 🔹 GET CURRENT GRATUITY CONFIG
    // =========================
    async getCurrentGratuity(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const config = await userGratuityService.getCurrentGratuity();

            return sendSuccessResponse(
                res,
                config,
                "Gratuity config retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Get gratuity config error:", error);
            return sendErrorResponse(res, error);
        }
    }
}