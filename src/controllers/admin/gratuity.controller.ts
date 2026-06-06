import { Response, NextFunction } from "express";
import logger from "../../logger";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { AdminGratuityService } from "../../services/admin/gratuity.services";
import { AdminAuthenticatedRequest } from "../../types/admin.management";

const adminGratuityService = new AdminGratuityService();

export class AdminGratuityController {

    // =========================
    // 🔹 GET CONFIG (ADMIN VIEW)
    // =========================
    async getConfig(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const config = await adminGratuityService.getConfig();

            return sendSuccessResponse(
                res,
                config,
                "Gratuity config fetched successfully"
            );
        } catch (error: any) {
            logger.error("Admin get config error:", error);
            return sendErrorResponse(res, error);
        }
    }

    async createGratuityConfig(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const config = await adminGratuityService.createConfig(req.body);
            logger.info("Gratuity config created successfully");
            return sendSuccessResponse(
                res,
                config,
                "Gratuity config created successfully"
            );
        } catch (error: any) {
            logger.error("Admin get config error:", error);
            return sendErrorResponse(res, error);
        }
    }

    // =========================
    // 🔹 UPDATE CONFIG
    // =========================
    async updateConfig(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const gratuityId = req.params.gratuityId
            const updated = await adminGratuityService.updateConfig(gratuityId, req.body);

            return sendSuccessResponse(
                res,
                updated,
                "Gratuity config updated successfully"
            );
        } catch (error: any) {
            logger.error("Update gratuity config error:", error);
            return sendErrorResponse(res, error);
        }
    }

    // =========================
    // 🔹 TOGGLE GRATUITY
    // =========================
    async toggleGratuity(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { isEnabled } = req.body;
            const gratuityId = req.params.gratuityId

            const updated = await adminGratuityService.toggleGratuity(gratuityId, isEnabled);

            return sendSuccessResponse(
                res,
                updated,
                `Gratuity ${isEnabled ? "enabled" : "disabled"} successfully`
            );
        } catch (error: any) {
            logger.error("Toggle gratuity error:", error);
            return sendErrorResponse(res, error);
        }
    }
}