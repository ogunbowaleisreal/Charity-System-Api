"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const roleService_1 = require("../../services/admin/roleService");
class RoleController {
    constructor() {
        this.roleService = new roleService_1.RoleService();
        // ============= ROLE MANAGEMENT =============
        this.getAllRoles = async (req, res) => {
            try {
                const { page = 1, limit = 10, search, sortBy = "createdAt", sortOrder = "desc", } = req.query;
                const filters = {
                    search: search,
                };
                const roles = await this.roleService.getAllRoles(parseInt(page), parseInt(limit), filters, sortBy, sortOrder);
                logger_1.default.info(`Admin retrieved roles list`, {
                    adminId: req.admin?.id,
                    email: req.admin?.email,
                    page,
                    limit,
                    filters,
                });
                (0, helpers_1.sendSuccessResponse)(res, roles, "Roles retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Error retrieving roles", {
                    error: error.message,
                    adminId: req.admin?.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.getRoleById = async (req, res) => {
            try {
                const { id } = req.params;
                const role = await this.roleService.getRoleById(id);
                if (!role) {
                    (0, helpers_1.sendErrorResponse)(res, "Role not found", constants_1.HTTP_STATUS.NOT_FOUND);
                    return;
                }
                logger_1.default.info(`Admin retrieved role details`, {
                    adminId: req.admin?.id,
                    roleId: id,
                });
                (0, helpers_1.sendSuccessResponse)(res, role, "Role retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Error retrieving role", {
                    error: error.message,
                    adminId: req.admin?.id,
                    roleId: req.params.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.createRole = async (req, res) => {
            try {
                const roleData = req.body;
                const newRole = await this.roleService.createRole(roleData);
                logger_1.default.info(`Admin created new role`, {
                    adminId: req.admin?.id,
                    roleName: newRole.name,
                    roleId: newRole._id,
                });
                (0, helpers_1.sendSuccessResponse)(res, newRole, "Role created successfully", constants_1.HTTP_STATUS.CREATED);
            }
            catch (error) {
                logger_1.default.error("Error creating role", {
                    error: error.message,
                    adminId: req.admin?.id,
                    roleData: req.body,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.updateRole = async (req, res) => {
            try {
                const { id } = req.params;
                const updateData = req.body;
                const updatedRole = await this.roleService.updateRole(id, updateData);
                if (!updatedRole) {
                    (0, helpers_1.sendErrorResponse)(res, "Role not found", constants_1.HTTP_STATUS.NOT_FOUND);
                    return;
                }
                logger_1.default.info(`Admin updated role`, {
                    adminId: req.admin?.id,
                    roleId: id,
                    updates: Object.keys(updateData),
                });
                (0, helpers_1.sendSuccessResponse)(res, updatedRole, "Role updated successfully");
            }
            catch (error) {
                logger_1.default.error("Error updating role", {
                    error: error.message,
                    adminId: req.admin?.id,
                    roleId: req.params.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.deleteRole = async (req, res) => {
            try {
                const { id } = req.params;
                await this.roleService.deleteRole(id);
                logger_1.default.info(`Admin deleted role`, {
                    adminId: req.admin?.id,
                    roleId: id,
                });
                (0, helpers_1.sendSuccessResponse)(res, null, "Role deleted successfully");
            }
            catch (error) {
                logger_1.default.error("Error deleting role", {
                    error: error.message,
                    adminId: req.admin?.id,
                    roleId: req.params.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.getAvailablePermissions = async (req, res) => {
            try {
                const permissions = await this.roleService.getAvailablePermissions();
                logger_1.default.info(`Admin retrieved available permissions`, {
                    adminId: req.admin?.id,
                });
                (0, helpers_1.sendSuccessResponse)(res, permissions, "Available permissions retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Error retrieving available permissions", {
                    error: error.message,
                    adminId: req.admin?.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.updateRolePermissions = async (req, res) => {
            try {
                const { id } = req.params;
                const { permissions } = req.body;
                const updatedRole = await this.roleService.updateRolePermissions(id, permissions);
                if (!updatedRole) {
                    (0, helpers_1.sendErrorResponse)(res, "Role not found", constants_1.HTTP_STATUS.NOT_FOUND);
                    return;
                }
                logger_1.default.info(`Admin updated role permissions`, {
                    adminId: req.admin?.id,
                    roleId: id,
                    permissionCount: permissions.length,
                });
                (0, helpers_1.sendSuccessResponse)(res, updatedRole, "Role permissions updated successfully");
            }
            catch (error) {
                logger_1.default.error("Error updating role permissions", {
                    error: error.message,
                    adminId: req.admin?.id,
                    roleId: req.params.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        // ============= ROLE ASSIGNMENT =============
        this.assignRole = async (req, res) => {
            try {
                const { adminId, roleId } = req.body;
                const result = await this.roleService.assignRole(adminId, roleId);
                logger_1.default.info(`Admin assigned role`, {
                    adminId: req.admin?.id,
                    targetAdminId: adminId,
                    roleId: roleId,
                });
                (0, helpers_1.sendSuccessResponse)(res, result, "Role assigned successfully");
            }
            catch (error) {
                logger_1.default.error("Error assigning role", {
                    error: error.message,
                    adminId: req.admin?.id,
                    assignmentData: req.body,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.revokeRole = async (req, res) => {
            try {
                const { adminId, roleId } = req.body;
                const result = await this.roleService.revokeRole(adminId, roleId);
                logger_1.default.info(`Admin revoked role`, {
                    adminId: req.admin?.id,
                    targetAdminId: adminId,
                    roleId: roleId,
                });
                (0, helpers_1.sendSuccessResponse)(res, result.admin, result.message);
            }
            catch (error) {
                logger_1.default.error("Error revoking role", {
                    error: error.message,
                    adminId: req.admin?.id,
                    revocationData: req.body,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.getUsersByRole = async (req, res) => {
            try {
                const { id } = req.params;
                const { page = 1, limit = 10 } = req.query;
                const users = await this.roleService.getUsersByRole(id, parseInt(page), parseInt(limit));
                logger_1.default.info(`Admin retrieved users by role`, {
                    adminId: req.admin?.id,
                    roleId: id,
                    page,
                    limit,
                });
                (0, helpers_1.sendSuccessResponse)(res, users, "Users retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Error retrieving users by role", {
                    error: error.message,
                    adminId: req.admin?.id,
                    roleId: req.params.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
    }
}
exports.RoleController = RoleController;
