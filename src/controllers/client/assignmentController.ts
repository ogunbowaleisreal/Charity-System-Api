import { clientAssignmentServices } from "../../services/client/assignments";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import logger from "../../logger";
import { sendSuccessResponse } from "../../utils/helpers";

const assignmentServices = new clientAssignmentServices()

export class ClientAssignmentsController {
    async getAssignments(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const clientId = req.user.userId
            const role = req.user.role
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const status =
                req.query.status === "removed" ? "removed" : "active";
            const assignments = await assignmentServices.getAssignments(clientId, role, page, limit, status)
            logger.info("assignments retrieved successfully")
            sendSuccessResponse(res, assignments, "assignments retrieved successfully", 200)
        } catch (error: any) {
            logger.error("assignments fetch failed", error.message)
            next(error)
        }
    }

}