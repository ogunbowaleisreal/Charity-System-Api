"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileController = void 0;
const clientProfile_services_1 = require("../../services/client/clientProfile.services");
const logger_1 = __importDefault(require("../../logger"));
const Auth_services_1 = require("../../services/client/Auth.services");
const helpers_1 = require("../../utils/helpers");
const clientServices = new clientProfile_services_1.clientProfileServices();
const authServices = new Auth_services_1.authService();
class profileController {
    async updateProfile(req, res, next) {
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
            const accountId = req.user?.user_id;
            const role = req.user?.role;
            console.log(role);
            if (role == "client") {
                const update = await clientServices.updateClientProfile(accountId, req.body);
                console.log(update);
                if (update) {
                    logger_1.default.info("profile updated successfully");
                    return (0, helpers_1.sendSuccessResponse)(res, update, "profile updated successfully", 200);
                }
                (0, helpers_1.sendErrorResponse)(res, "update failed");
            }
            const update = await clientServices.updateClientProfile(accountId, req.body);
            console.log(update);
            if (update) {
                logger_1.default.info("profile updated successfully");
                return (0, helpers_1.sendSuccessResponse)(res, update, "profile updated successfully", 200);
            }
            (0, helpers_1.sendErrorResponse)(res, "update failed");
        }
        catch (err) {
            logger_1.default.error("update failed");
            next(err);
            //sendErrorResponse(res, "update failed", 403)
        }
    }
    async changePassword(req, res, next) {
        try {
            const accountId = req.user.user_id;
            const { oldPassword, newPassword } = req.body;
            const passwordUpdate = await authServices.changePassword(accountId, oldPassword, newPassword);
            if (!passwordUpdate) {
                (0, helpers_1.sendErrorResponse)(res, "password change failed");
            }
            (0, helpers_1.sendSuccessResponse)(res, { success: true }, "password changed successfully", 200);
        }
        catch (err) {
            logger_1.default.error("password change failed", err.message);
            //sendErrorResponse(res, err.message, err.statusCode)
            next(err);
        }
    }
    async getClientProfile(req, res, next) {
        try {
            const clientId = req.user.user_id;
            const profile = await clientServices.getClientProfile(clientId);
            (0, helpers_1.sendSuccessResponse)(res, profile, "profile fetched");
        }
        catch (err) {
            logger_1.default.error("profile fetch failed");
            next(err);
        }
    }
}
exports.profileController = profileController;
