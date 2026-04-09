import { Response } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import logger from "../../logger";
import { RoleService } from "../../services/admin/roleService";

export class RoleController {
    private roleService = new RoleService();

    // ============= ROLE MANAGEMENT =============
    getAllRoles = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                sortBy = "createdAt",
                sortOrder = "desc",
            } = req.query;

            const filters = {
                search: search as string,
            };

            const roles = await this.roleService.getAllRoles(
                parseInt(page as string),
                parseInt(limit as string),
                filters,
                sortBy as string,
                sortOrder as "asc" | "desc"
            );

            logger.info(`Admin retrieved roles list`, {
                adminId: req.admin?.id,
                email: req.admin?.email,
                page,
                limit,
                filters,
            });

            sendSuccessResponse(res, roles, "Roles retrieved successfully");
        } catch (error: any) {
            logger.error("Error retrieving roles", {
                error: error.message,
                adminId: req.admin?.id,
            });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    getRoleById = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;

            const role = await this.roleService.getRoleById(id);

            if (!role) {
                sendErrorResponse(res, "Role not found", HTTP_STATUS.NOT_FOUND);
                return;
            }

            logger.info(`Admin retrieved role details`, {
                adminId: req.admin?.id,
                roleId: id,
            });

            sendSuccessResponse(res, role, "Role retrieved successfully");
        } catch (error: any) {
            logger.error("Error retrieving role", {
                error: error.message,
                adminId: req.admin?.id,
                roleId: req.params.id,
            });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    createRole = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const roleData = req.body;

            const newRole = await this.roleService.createRole(roleData);

            logger.info(`Admin created new role`, {
                adminId: req.admin?.id,
                roleName: newRole.name,
                roleId: newRole._id,
            });

            sendSuccessResponse(
                res,
                newRole,
                "Role created successfully",
                HTTP_STATUS.CREATED
            );
        } catch (error: any) {
            logger.error("Error creating role", {
                error: error.message,
                adminId: req.admin?.id,
                roleData: req.body,
            });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    updateRole = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const updatedRole = await this.roleService.updateRole(id, updateData);

            if (!updatedRole) {
                sendErrorResponse(res, "Role not found", HTTP_STATUS.NOT_FOUND);
                return;
            }

            logger.info(`Admin updated role`, {
                adminId: req.admin?.id,
                roleId: id,
                updates: Object.keys(updateData),
            });

            sendSuccessResponse(res, updatedRole, "Role updated successfully");
        } catch (error: any) {
            logger.error("Error updating role", {
                error: error.message,
                adminId: req.admin?.id,
                roleId: req.params.id,
            });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    deleteRole = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;

            await this.roleService.deleteRole(id);

            logger.info(`Admin deleted role`, {
                adminId: req.admin?.id,
                roleId: id,
            });

            sendSuccessResponse(res, null, "Role deleted successfully");
        } catch (error: any) {
            logger.error("Error deleting role", {
                error: error.message,
                adminId: req.admin?.id,
                roleId: req.params.id,
            });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    getAvailablePermissions = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const permissions = await this.roleService.getAvailablePermissions();

            logger.info(`Admin retrieved available permissions`, {
                adminId: req.admin?.id,
            });

            sendSuccessResponse(
                res,
                permissions,
                "Available permissions retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Error retrieving available permissions", {
                error: error.message,
                adminId: req.admin?.id,
            });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    updateRolePermissions = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const { permissions } = req.body;

            const updatedRole = await this.roleService.updateRolePermissions(
                id,
                permissions
            );

            if (!updatedRole) {
                sendErrorResponse(res, "Role not found", HTTP_STATUS.NOT_FOUND);
                return;
            }

            logger.info(`Admin updated role permissions`, {
                adminId: req.admin?.id,
                roleId: id,
                permissionCount: permissions.length,
            });

            sendSuccessResponse(
                res,
                updatedRole,
                "Role permissions updated successfully"
            );
        } catch (error: any) {
            logger.error("Error updating role permissions", {
                error: error.message,
                adminId: req.admin?.id,
                roleId: req.params.id,
            });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    // ============= ROLE ASSIGNMENT =============
    assignRole = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const { adminId, roleId } = req.body;

            const result = await this.roleService.assignRole(adminId, roleId);

            logger.info(`Admin assigned role`, {
                adminId: req.admin?.id,
                targetAdminId: adminId,
                roleId: roleId,
            });

            sendSuccessResponse(res, result, "Role assigned successfully");
        } catch (error: any) {
            logger.error("Error assigning role", {
                error: error.message,
                adminId: req.admin?.id,
                assignmentData: req.body,
            });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    revokeRole = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const { adminId, roleId } = req.body;

            const result = await this.roleService.revokeRole(adminId, roleId);

            logger.info(`Admin revoked role`, {
                adminId: req.admin?.id,
                targetAdminId: adminId,
                roleId: roleId,
            });

            sendSuccessResponse(res, result.admin, result.message);
        } catch (error: any) {
            logger.error("Error revoking role", {
                error: error.message,
                adminId: req.admin?.id,
                revocationData: req.body,
            });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    getUsersByRole = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const users = await this.roleService.getUsersByRole(
                id,
                parseInt(page as string),
                parseInt(limit as string)
            );

            logger.info(`Admin retrieved users by role`, {
                adminId: req.admin?.id,
                roleId: id,
                page,
                limit,
            });

            sendSuccessResponse(res, users, "Users retrieved successfully");
        } catch (error: any) {
            logger.error("Error retrieving users by role", {
                error: error.message,
                adminId: req.admin?.id,
                roleId: req.params.id,
            });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

}
