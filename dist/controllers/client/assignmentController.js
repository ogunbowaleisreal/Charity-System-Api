"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientAssignmentsController = void 0;
const assignments_1 = require("../../services/client/assignments");
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const assignmentServices = new assignments_1.clientAssignmentServices();
class ClientAssignmentsController {
    async getAssignments(req, res, next) {
        try {
            const clientId = req.user.userId;
            const role = req.user.role;
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const status = req.query.status === "removed" ? "removed" : "active";
            const assignments = await assignmentServices.getAssignments(clientId, role, page, limit, status);
            logger_1.default.info("assignments retrieved successfully");
            (0, helpers_1.sendSuccessResponse)(res, assignments, "assignments retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error("assignments fetch failed", error.message);
            next(error);
        }
    }
}
exports.ClientAssignmentsController = ClientAssignmentsController;
