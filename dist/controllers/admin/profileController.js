"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const logger_1 = __importDefault(require("../../logger"));
const profileServices_1 = require("../../services/admin/profileServices");
const constants_1 = require("../../utils/constants");
const helpers_1 = require("../../utils/helpers");
class ProfileController {
    constructor() {
        this.profileService = new profileServices_1.ProfileService();
    }
    async updateProfile(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            if (!adminId) {
                (0, helpers_1.sendErrorResponse)(res, "You have to be authenticated to make this request", constants_1.HTTP_STATUS.UNAUTHORIZED);
                return;
            }
            const admin = await this.profileService.updateAdminProfile(adminId, req.body);
            logger_1.default.info("Admin profile updated", { adminId: req.admin?.adminId });
            (0, helpers_1.sendSuccessResponse)(res, admin, "Profile updated successfully");
        }
        catch (error) {
            logger_1.default.error("Update admin profile failed", {
                error: error.message,
                adminId: req.admin?.adminId,
            });
            (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async changePassword(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            if (!adminId) {
                (0, helpers_1.sendErrorResponse)(res, "Admin not authenticated", constants_1.HTTP_STATUS.UNAUTHORIZED);
                return;
            }
            const { newPassword, currentPassword } = req.body;
            const result = await this.profileService.changePassword(adminId, newPassword, currentPassword);
            (0, helpers_1.sendSuccessResponse)(res, null, "Password changed successfully");
        }
        catch (error) {
            logger_1.default.error("Error changing admin password", {
                message: error.message,
                adminId: req.admin?.adminId,
                adminEmail: req.admin?.email,
            });
            next(error);
        }
    }
    async getProfile(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            if (!adminId) {
                (0, helpers_1.sendErrorResponse)(res, "You have to be authenticated to make this request", constants_1.HTTP_STATUS.UNAUTHORIZED);
                return;
            }
            const profile = await this.profileService.fetchProfile(adminId);
            (0, helpers_1.sendSuccessResponse)(res, profile, "Profile fetched Successfully");
        }
        catch (error) {
            logger_1.default.error("Failed to fetch Admin profile", {
                message: error.message,
                adminId: req.admin?.adminId,
            });
            next(error);
        }
    }
    async toggle2FA(req, res) {
        try {
            const { enabled } = req.body;
            const adminId = req.admin?.adminId;
            if (!adminId) {
                (0, helpers_1.sendErrorResponse)(res, "Must be logged in to perform this action", constants_1.HTTP_STATUS.UNAUTHORIZED);
                return;
            }
            let result;
            if (enabled) {
                result = await this.profileService.enable2FA(adminId);
            }
            else {
                result = await this.profileService.disable2FA(adminId);
            }
            if (!result) {
                (0, helpers_1.sendErrorResponse)(res, "failed to set 2fa", constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
            if (!result.success) {
                (0, helpers_1.sendErrorResponse)(res, "failed to set 2fa", constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
            (0, helpers_1.sendSuccessResponse)(res, { twoFactorEnabled: enabled, ...result.admin }, result.message);
        }
        catch (error) {
            logger_1.default.error("Toggle 2FA error", {
                message: error.message,
                statusCode: error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
            (0, helpers_1.sendErrorResponse)(res, "Internal server error", constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}
exports.ProfileController = ProfileController;
