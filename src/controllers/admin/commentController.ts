import { CommentAdminService } from "../../services/admin/comment.services";
import { Request, Response } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";

const commentService = new CommentAdminService();

export class CommentController {
    // async getAllComments(req: AdminAuthenticatedRequest, res: Response) {
    //     try {
    //         const comments = await commentService.getAllComments();
    //         return sendSuccessResponse(res, HTTP_STATUS.OK, comments);
    //     } catch (error: any) {
    //         logger.error(error);
    //         return sendErrorResponse(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR,);
    //     }
    // }

    async getUserComments(req: AdminAuthenticatedRequest, res: Response) {
        try {
            const comments = await commentService.getUserComments(req.params.user_id, req.query);
            return sendSuccessResponse(res, comments, "comments retrieved successfully", HTTP_STATUS.OK,);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}