"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminManagementController = void 0;
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const adminManagementService_1 = require("../../services/admin/adminManagementService");
class AdminManagementController {
    constructor() {
        this.adminManagementService = new adminManagementService_1.AdminManagementService();
        this.createAdmin = async (req, res) => {
            try {
                const creatorId = req.admin.adminId;
                if (!creatorId) {
                    (0, helpers_1.sendErrorResponse)(res, "Unauthorized", constants_1.HTTP_STATUS.UNAUTHORIZED);
                    return;
                }
                const admin = await this.adminManagementService.createAdmin(req.body, creatorId);
                logger_1.default.info("Admin account created", {
                    newAdminId: admin._id.toString(),
                    createdBy: creatorId,
                    adminLevel: admin.adminLevel,
                });
                (0, helpers_1.sendSuccessResponse)(res, admin, "Admin account created successfully", constants_1.HTTP_STATUS.CREATED);
            }
            catch (error) {
                logger_1.default.error("Failed to create admin account", {
                    error: error.message,
                    createdBy: req.admin?.adminId,
                    email: req.body.email,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.getAllAdmins = async (req, res) => {
            try {
                const result = await this.adminManagementService.getAllAdmins(req.query);
                (0, helpers_1.sendSuccessResponse)(res, result, "Admins retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to get admins", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.getAdminById = async (req, res) => {
            try {
                const { adminId } = req.params;
                const admin = await this.adminManagementService.getAdminById(adminId);
                (0, helpers_1.sendSuccessResponse)(res, { admin }, "Admin retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to get admin", {
                    adminId: req.params.adminId,
                    error: error.message,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.updateAdmin = async (req, res) => {
            try {
                const { adminId } = req.params;
                const updatedBy = req.admin?.adminId;
                if (!updatedBy) {
                    (0, helpers_1.sendErrorResponse)(res, "Unauthorized", constants_1.HTTP_STATUS.UNAUTHORIZED);
                    return;
                }
                const admin = await this.adminManagementService.updateAdmin(adminId, req.body, updatedBy);
                logger_1.default.info("Admin account updated", {
                    adminId,
                    updatedBy,
                    updates: Object.keys(req.body),
                });
                (0, helpers_1.sendSuccessResponse)(res, { admin }, "Admin account updated successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to update admin", {
                    adminId: req.params.adminId,
                    error: error.message,
                    updatedBy: req.admin?.adminId,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.suspendAdmin = async (req, res) => {
            try {
                const { adminId } = req.params;
                const suspendedBy = req.admin.adminId;
                const reason = req.body.reason;
                const action = req.body.action;
                const admin = await this.adminManagementService.suspendAdmin(adminId, action, 
                //req.body,
                suspendedBy, reason);
                logger_1.default.info("Admin account updated", {
                    adminId,
                    suspendedBy,
                    updates: Object.keys(req.body),
                });
                (0, helpers_1.sendSuccessResponse)(res, { admin }, "Admin account updated successfully");
            }
            catch (error) {
            }
        };
        this.deactivateAdmin = async (req, res) => {
            try {
                const { adminId } = req.params;
                const deactivatedBy = req.admin?.adminId;
                if (!deactivatedBy) {
                    (0, helpers_1.sendErrorResponse)(res, "Unauthorized", constants_1.HTTP_STATUS.UNAUTHORIZED);
                    return;
                }
                await this.adminManagementService.deactivateAdmin(adminId, deactivatedBy);
                logger_1.default.info("Admin account deleted", {
                    adminId,
                    deactivatedBy,
                });
                (0, helpers_1.sendSuccessResponse)(res, null, "Admin account deleted successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to delete admin", {
                    adminId: req.params.adminId,
                    error: error.message,
                    deactivatedBy: req.admin?.adminId,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.resetAdminPassword = async (req, res) => {
            try {
                const { adminId } = req.params;
                const resetBy = req.admin?.adminId;
                if (!resetBy) {
                    (0, helpers_1.sendErrorResponse)(res, "Unauthorized", constants_1.HTTP_STATUS.UNAUTHORIZED);
                    return;
                }
                await this.adminManagementService.resetAdminPassword(adminId, resetBy);
                logger_1.default.info("Admin password reset", {
                    adminId,
                    resetBy,
                });
                (0, helpers_1.sendSuccessResponse)(res, null, "Admin password reset successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to reset admin password", {
                    adminId: req.params.adminId,
                    error: error.message,
                    resetBy: req.admin?.adminId,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.getAdminStatistics = async (req, res) => {
            try {
                const stats = await this.adminManagementService.getAdminStatistics();
                (0, helpers_1.sendSuccessResponse)(res, stats, "Admin statistics retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to get admin statistics", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
    }
}
exports.AdminManagementController = AdminManagementController;
