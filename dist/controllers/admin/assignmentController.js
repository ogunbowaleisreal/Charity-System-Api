"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAssignmentController = void 0;
const assignmentsManagement_1 = require("../../services/admin/assignmentsManagement");
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const assignmentServices = new assignmentsManagement_1.assignmentManagementServices();
class AdminAssignmentController {
    async assignConsultant(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const assignments = await assignmentServices.assignConsultant(req.params.client_id, req.body.consultantId, req.body.requestId, adminId);
            (0, helpers_1.sendSuccessResponse)(res, assignments, "request assigned successfully", 200);
        }
        catch (error) {
            logger_1.default.error("request assignment failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async removeAssignment(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            //console.log(adminId)
            //const clientId = req.params.assignment_id
            //const client = await Account.findById(clientId)
            const assignments = await assignmentServices.removeAssignment(req.params.assignment_id);
            (0, helpers_1.sendSuccessResponse)(res, assignments, "request unassigned successfully", 200);
        }
        catch (error) {
            logger_1.default.error("request unassignment failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async unassignConsultantClient(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const BidId = req.params.bid_id;
            const assignments = await assignmentServices.unassignConsultantClient(BidId);
            (0, helpers_1.sendSuccessResponse)(res, assignments, "request unassigned successfully", 200);
        }
        catch (error) {
            logger_1.default.error("request unassignment failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async getAssignments(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const accountId = req.params.account_id;
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const assignments = await assignmentServices.getClientAssignment(accountId, page, limit);
            (0, helpers_1.sendSuccessResponse)(res, assignments, "assignments retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error("assignments fetch failed", error.message);
            next(error);
        }
    }
}
exports.AdminAssignmentController = AdminAssignmentController;
