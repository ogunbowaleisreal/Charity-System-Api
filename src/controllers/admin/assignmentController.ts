import { assignmentManagementServices } from "../../services/admin/assignmentsManagement";
import { Request, Response, NextFunction } from "express"
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import logger from "../../logger";
import { Account } from "../../models/Accounts";
import { sendSuccessResponse } from "../../utils/helpers";

const assignmentServices = new assignmentManagementServices()
export class AdminAssignmentController {
    async assignConsultant(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId
            const assignments = await assignmentServices.assignConsultant(req.params.client_id, req.body.consultantId, req.body.requestId, adminId as string)
            sendSuccessResponse(res, assignments, "request assigned successfully", 200)
        } catch (error: any) {
            logger.error("request assignment failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async removeAssignment(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId
            //console.log(adminId)
            //const clientId = req.params.assignment_id
            //const client = await Account.findById(clientId)
            const assignments = await assignmentServices.removeAssignment(req.params.assignment_id)
            sendSuccessResponse(res, assignments, "request unassigned successfully", 200)
        } catch (error: any) {
            logger.error("request unassignment failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async unassignConsultantClient(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId
            const BidId = req.params.bid_id
            const assignments = await assignmentServices.unassignConsultantClient(BidId)
            sendSuccessResponse(res, assignments, "request unassigned successfully", 200)
        } catch (error: any) {
            logger.error("request unassignment failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async getAssignments(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId
            const accountId = req.params.account_id
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const assignments = await assignmentServices.getClientAssignment(accountId as string, page, limit)
            sendSuccessResponse(res, assignments, "assignments retrieved successfully", 200)
        } catch (error: any) {
            logger.error("assignments fetch failed", error.message)
            next(error)
        }
    }
}