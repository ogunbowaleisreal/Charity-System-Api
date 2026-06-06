"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminGratuityController = void 0;
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const gratuity_services_1 = require("../../services/admin/gratuity.services");
const adminGratuityService = new gratuity_services_1.AdminGratuityService();
class AdminGratuityController {
    // =========================
    // 🔹 GET CONFIG (ADMIN VIEW)
    // =========================
    async getConfig(req, res, next) {
        try {
            const config = await adminGratuityService.getConfig();
            return (0, helpers_1.sendSuccessResponse)(res, config, "Gratuity config fetched successfully");
        }
        catch (error) {
            logger_1.default.error("Admin get config error:", error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    async createGratuityConfig(req, res, next) {
        try {
            const config = await adminGratuityService.createConfig(req.body);
            logger_1.default.info("Gratuity config created successfully");
            return (0, helpers_1.sendSuccessResponse)(res, config, "Gratuity config created successfully");
        }
        catch (error) {
            logger_1.default.error("Admin get config error:", error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =========================
    // 🔹 UPDATE CONFIG
    // =========================
    async updateConfig(req, res, next) {
        try {
            const gratuityId = req.params.gratuityId;
            const updated = await adminGratuityService.updateConfig(gratuityId, req.body);
            return (0, helpers_1.sendSuccessResponse)(res, updated, "Gratuity config updated successfully");
        }
        catch (error) {
            logger_1.default.error("Update gratuity config error:", error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =========================
    // 🔹 TOGGLE GRATUITY
    // =========================
    async toggleGratuity(req, res, next) {
        try {
            const { isEnabled } = req.body;
            const gratuityId = req.params.gratuityId;
            const updated = await adminGratuityService.toggleGratuity(gratuityId, isEnabled);
            return (0, helpers_1.sendSuccessResponse)(res, updated, `Gratuity ${isEnabled ? "enabled" : "disabled"} successfully`);
        }
        catch (error) {
            logger_1.default.error("Toggle gratuity error:", error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
}
exports.AdminGratuityController = AdminGratuityController;
