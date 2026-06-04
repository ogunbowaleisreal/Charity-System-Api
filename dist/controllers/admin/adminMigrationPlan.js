"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPlanMigrationController = void 0;
const adminMigrationPlan_1 = require("../../services/admin/adminMigrationPlan");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const migrationService = new adminMigrationPlan_1.AdminPlanMigrationService();
class AdminPlanMigrationController {
    async migratePlan(req, res, next) {
        try {
            const { oldPlanId, newPlanId } = req.body;
            const result = await migrationService.migratePlan(oldPlanId, newPlanId);
            return (0, helpers_1.sendSuccessResponse)(res, result, "Plan migration completed successfully", 200);
        }
        catch (err) {
            logger_1.default.error(err.message);
            return (0, helpers_1.sendErrorResponse)(res, err.message || "Migration failed", 500);
        }
    }
}
exports.AdminPlanMigrationController = AdminPlanMigrationController;
