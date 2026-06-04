"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanController = void 0;
const planServices_1 = require("../../services/client/planServices");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const planService = new planServices_1.PlanServices();
class PlanController {
    async createPlan(req, res, next) {
        try {
            const planData = req.body;
            const newPlan = await planService.createPlan(planData);
            (0, helpers_1.sendSuccessResponse)(res, newPlan, "plan created successfully", 200);
        }
        catch (error) {
            logger_1.default.error("plan creation failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async getPlanByCode(req, res, next) {
        try {
            const planCode = req.body.planCode;
            const plan = await planService.getPlan(planCode);
            (0, helpers_1.sendSuccessResponse)(res, plan, "plan retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error("plan retrieval failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async listPlans(req, res, next) {
        try {
            const plans = await planService.listPlans();
            (0, helpers_1.sendSuccessResponse)(res, plans, "plans retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error("plan retrieval failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
}
exports.PlanController = PlanController;
