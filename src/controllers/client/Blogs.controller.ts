import { Request, Response, NextFunction } from "express";
import logger from "../../logger";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { BlogService } from "../../services/client/clientBlogService";
import { AuthenticatedClientRequest } from "../../middleware/auth";

const blogService = new BlogService();

export class BlogController {
    // =============================
    // 🔹 GET ALL PUBLISHED BLOGS
    // =============================
    async getAllBlogs(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await blogService.getAllBlogs(req.query);
            return sendSuccessResponse(res, result);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    // =============================
    // 🔹 GET FEATURED BLOGS
    // =============================
    async getFeaturedBlogs(req: Request, res: Response, next: NextFunction) {
        try {
            const blogs = await blogService.getFeaturedBlogs(req.query);
            return sendSuccessResponse(res, blogs);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    // =============================
    // 🔹 GET SINGLE BLOG (by slug)
    // =============================
    async getBlogBySlug(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params;
            const blog = await blogService.getBlogBySlug(slug as string);
            return sendSuccessResponse(res, blog);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    // =============================
    // 🔹 LIKE / UNLIKE BLOG
    // =============================
    async toggleLike(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const { blogId } = req.params;
            const result = await blogService.toggleLike(blogId as string, req.user._id);
            return sendSuccessResponse(res, result);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }
}

export default BlogController;