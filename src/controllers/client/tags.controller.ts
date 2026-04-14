import { Request, Response, NextFunction } from "express";
import { TagService } from "../../services/client/tags.service";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { AuthenticatedClientRequest } from "../../middleware/auth";

const tagService = new TagService();

export class TagController {
    async getAllTags(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const tags = await tagService.getTags();
            return sendSuccessResponse(res, { tags });
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }
}