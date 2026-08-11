import { Response, NextFunction } from "express";
import { BlogAdminService } from "../../services/Blogs.services";
import { sendSuccessResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";

const blogAdminService = new BlogAdminService();

export class BlogAdminController {
    // =========================
    // ✍️ CREATE BLOG
    // =========================
    async createBlog(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId as string;
            const blog = await blogAdminService.createBlog(adminId, req.body);
            return sendSuccessResponse(res, blog, "blog created successfully", HTTP_STATUS.CREATED);
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    // =========================
    // 📝 UPDATE BLOG
    // =========================
    async updateBlog(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId as string;
            const { blogId } = req.params;
            const blog = await blogAdminService.updateBlog(blogId, adminId, req.body);
            return sendSuccessResponse(res, blog, "blog updated successfully");
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    // =========================
    // 🗑️ DELETE BLOG
    // =========================
    async deleteBlog(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { blogId } = req.params;
            await blogAdminService.deleteBlog(blogId);
            return sendSuccessResponse(res, null, "blog deleted successfully");
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    // =========================
    // 📊 GET ALL BLOGS
    // =========================
    async getAllBlogs(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const blogs = await blogAdminService.getAllBlogs(req.query);
            return sendSuccessResponse(res, blogs, "blogs retrieved successfully", HTTP_STATUS.OK);
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    // =========================
    // 🎯 GET BLOG DETAILS
    // =========================
    async getBlogById(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { blogId } = req.params;
            const blog = await blogAdminService.getBlogById(blogId);
            return sendSuccessResponse(res, blog);
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    // =========================
    // 📢 PUBLISH / UNPUBLISH / ARCHIVE
    // =========================
    async publishBlog(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { blogId } = req.params;
            const blog = await blogAdminService.publishBlog(blogId);
            return sendSuccessResponse(res, blog, "blog published");
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async unpublishBlog(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { blogId } = req.params;
            const blog = await blogAdminService.unpublishBlog(blogId);
            return sendSuccessResponse(res, blog, "blog moved to draft");
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async archiveBlog(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { blogId } = req.params;
            const blog = await blogAdminService.archiveBlog(blogId);
            return sendSuccessResponse(res, blog, "blog archived");
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    // =========================
    // ⭐ FEATURE TOGGLE
    // =========================
    async setBlogFeatured(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { blogId } = req.params;
            const { isFeatured } = req.body;
            const blog = await blogAdminService.setBlogFeatured(blogId, !!isFeatured);
            return sendSuccessResponse(res, blog, "blog feature status updated");
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    // =========================
    // 📈 STATS
    // =========================
    async getBlogStats(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { blogId } = req.params;
            const stats = await blogAdminService.getBlogStats(blogId);
            return sendSuccessResponse(res, stats);
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }
}

export default BlogAdminController;