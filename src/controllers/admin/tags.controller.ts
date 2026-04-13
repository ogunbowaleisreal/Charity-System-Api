import { Response } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { TagService } from "../../services/admin/tag.services";

export class TagController {
    private tagService = new TagService();

    createTag = async (req: AdminAuthenticatedRequest, res: Response) => {
        try {
            const tag = await this.tagService.createTag(
                req.body,
                req.admin ? req.admin.id : ""
            );
            sendSuccessResponse(res, tag, "Tag created successfully");
        } catch (error: any) {
            logger.error("Create tag failed", { error: error.message });
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    };

    updateTag = async (req: AdminAuthenticatedRequest, res: Response) => {
        try {
            const tag = await this.tagService.updateTag(
                req.params.tagId,
                req.body
            );
            sendSuccessResponse(res, tag, "Tag updated successfully");
        } catch (error: any) {
            logger.error("Update tag failed", { error: error.message });
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    };

    deleteTag = async (req: AdminAuthenticatedRequest, res: Response) => {
        try {
            const tag = await this.tagService.deleteTag(req.params.tagId);
            sendSuccessResponse(res, tag, "Tag deleted successfully");
        } catch (error: any) {
            logger.error("Delete tag failed", { error: error.message });
            sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        }
    };

    getTagById = async (req: AdminAuthenticatedRequest, res: Response) => {
        try {
            const tag = await this.tagService.getTagById(req.params.tagId);
            sendSuccessResponse(res, tag, "Tag retrieved successfully");
        } catch (error: any) {
            logger.error("Get tag failed", { error: error.message });
            sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        }
    };

    getAllTags = async (req: AdminAuthenticatedRequest, res: Response) => {
        try {
            const tags = await this.tagService.getAllTags(req.query as any);
            sendSuccessResponse(res, tags, "Tags retrieved successfully");
        } catch (error: any) {
            logger.error("Get tags failed", { error: error.message });
            sendErrorResponse(
                res,
                error.message,
                HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };
}
