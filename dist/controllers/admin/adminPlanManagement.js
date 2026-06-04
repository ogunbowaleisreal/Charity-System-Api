"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPlanController = void 0;
const adminPlanManagement_1 = require("../../services/admin/adminPlanManagement");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const planService = new adminPlanManagement_1.AdminPlanManagementService();
class AdminPlanController {
    async createPlan(req, res, next) {
        try {
            const plan = await planService.createPlan(req.body);
            return (0, helpers_1.sendSuccessResponse)(res, plan, "Plan created successfully", 201);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    async updatePlan(req, res, next) {
        try {
            const plan = await planService.updatePlan(req.params.planId, req.body);
            return (0, helpers_1.sendSuccessResponse)(res, plan, "Plan updated successfully", 200);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    async getPlan(req, res, next) {
        try {
            const plan = await planService.getPlan(req.params.planId);
            return (0, helpers_1.sendSuccessResponse)(res, plan, "Plan retrieved successfully", 200);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    async getAllPlans(req, res, next) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const { page: _p, limit: _l, ...queryObj } = req.query;
            const plans = await planService.getAllPlans(page, limit, queryObj);
            return (0, helpers_1.sendSuccessResponse)(res, plans, "Plans retrieved successfully", 200);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
}
exports.AdminPlanController = AdminPlanController;
