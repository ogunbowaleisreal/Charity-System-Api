import { Request, Response } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AdminRequest } from "../../middleware/verify.admin";
import { AdminManagementService } from "../../services/admin/adminManagementService";

export class AdminManagementController {
    private adminManagementService = new AdminManagementService();

    createAdmin = async (
        req: AdminRequest,
        res: Response
    ): Promise<void> => {
        try {
            const creatorId = req.admin.adminId;
            if (!creatorId) {
                sendErrorResponse(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
                return;
            }

            const admin = await this.adminManagementService.createAdmin(
                req.body,
                creatorId
            );

            logger.info("Admin account created", {
                newAdminId: admin._id.toString(),
                createdBy: creatorId,
                adminLevel: admin.adminLevel,
            });

            sendSuccessResponse(
                res,
                admin,
                "Admin account created successfully",
                HTTP_STATUS.CREATED
            );
        } catch (error: any) {
            logger.error("Failed to create admin account", {
                error: error.message,
                createdBy: req.admin?.adminId,
                email: req.body.email,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    getAllAdmins = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.adminManagementService.getAllAdmins(
                req.query as any
            );

            sendSuccessResponse(res, result, "Admins retrieved successfully");
        } catch (error: any) {
            logger.error("Failed to get admins", { error: error.message });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    getAdminById = async (req: Request, res: Response): Promise<void> => {
        try {
            const adminId = req.params.adminId as string;
            const admin = await this.adminManagementService.getAdminById(adminId);

            sendSuccessResponse(res, { admin }, "Admin retrieved successfully");
        } catch (error: any) {
            logger.error("Failed to get admin", {
                adminId: req.params.adminId,
                error: error.message,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    updateAdmin = async (
        req: AdminRequest,
        res: Response
    ): Promise<void> => {
        try {
            const adminId = req.params.adminId as string;
            const updatedBy = req.admin?.adminId;

            if (!updatedBy) {
                sendErrorResponse(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
                return;
            }

            const admin = await this.adminManagementService.updateAdmin(
                adminId,
                req.body,
                updatedBy
            );

            logger.info("Admin account updated", {
                adminId,
                updatedBy,
                updates: Object.keys(req.body),
            });

            sendSuccessResponse(res, { admin }, "Admin account updated successfully");
        } catch (error: any) {
            logger.error("Failed to update admin", {
                adminId: req.params.adminId,
                error: error.message,
                updatedBy: req.admin?.adminId,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    suspendAdmin = async (
        req: AdminRequest,
        res: Response
    ): Promise<void> => {
        try {
            const adminId = req.params.adminId as string;
            const suspendedBy = req.admin.adminId
            const reason = req.body.reason
            const action = req.body.action
            const admin = await this.adminManagementService.suspendAdmin(
                adminId,
                action,
                //req.body,
                suspendedBy,
                reason
            );

            logger.info("Admin account updated", {
                adminId,
                suspendedBy,
                updates: Object.keys(req.body),
            });

            sendSuccessResponse(res, { admin }, "Admin account updated successfully");

        } catch (error: any) {

        }
    }



    deactivateAdmin = async (
        req: AdminRequest,
        res: Response
    ): Promise<void> => {
        try {
            const adminId = req.params.adminId as string;
            const deactivatedBy = req.admin?.adminId;

            if (!deactivatedBy) {
                sendErrorResponse(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
                return;
            }

            await this.adminManagementService.deactivateAdmin(adminId, deactivatedBy);

            logger.info("Admin account deleted", {
                adminId,
                deactivatedBy,
            });

            sendSuccessResponse(res, null, "Admin account deleted successfully");
        } catch (error: any) {
            logger.error("Failed to delete admin", {
                adminId: req.params.adminId,
                error: error.message,
                deactivatedBy: req.admin?.adminId,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    resetAdminPassword = async (
        req: AdminRequest,
        res: Response
    ): Promise<void> => {
        try {
            const adminId = req.params.adminId as string;
            const resetBy = req.admin?.adminId;

            if (!resetBy) {
                sendErrorResponse(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
                return;
            }

            await this.adminManagementService.resetAdminPassword(
                adminId,
                resetBy
            );

            logger.info("Admin password reset", {
                adminId,
                resetBy,
            });

            sendSuccessResponse(res, null, "Admin password reset successfully");
        } catch (error: any) {
            logger.error("Failed to reset admin password", {
                adminId: req.params.adminId,
                error: error.message,
                resetBy: req.admin?.adminId,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    getAdminStatistics = async (req: Request, res: Response): Promise<void> => {
        try {
            const stats = await this.adminManagementService.getAdminStatistics();

            sendSuccessResponse(
                res,
                stats,
                "Admin statistics retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Failed to get admin statistics", { error: error.message });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };
}
