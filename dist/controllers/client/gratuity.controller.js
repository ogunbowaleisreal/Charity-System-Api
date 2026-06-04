"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserGratuityController = void 0;
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const gratuity_services_1 = require("../../services/client/gratuity.services");
const userGratuityService = new gratuity_services_1.UserGratuityService();
class UserGratuityController {
    // =========================
    // 🔹 GET CURRENT GRATUITY CONFIG
    // =========================
    async getCurrentGratuity(req, res, next) {
        try {
            const config = await userGratuityService.getCurrentGratuity();
            return (0, helpers_1.sendSuccessResponse)(res, config, "Gratuity config retrieved successfully");
        }
        catch (error) {
            logger_1.default.error("Get gratuity config error:", error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
}
exports.UserGratuityController = UserGratuityController;
