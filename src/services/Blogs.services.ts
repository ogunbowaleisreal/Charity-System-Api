import { Blog, IBlog } from "../models/Blogs";
import { FilterQuery } from "mongoose";
import logger from "../logger";

interface BlogAdminQuery {
    page?: string | number;
    limit?: string | number;
    search?: string;
    status?: string;
    category?: string;
    isFeatured?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export class BlogAdminService {
    // =============================
    // 🔹 CREATE
    // =============================
    async createBlog(
        adminId: string,
        data: {
            title: string;
            content: string;
            excerpt?: string;
            coverImage?: string;
            images?: string[];
            category?: string;
            tags?: string[];
            status?: "draft" | "published" | "archived";
            isFeatured?: boolean;
        }
    ) {
        if (!data.title || !data.content) {
            throw new Error("Title and content are required");
        }

        const blog = await Blog.create({
            ...data,
            author: adminId,
        });

        logger.info("Blog created", { blogId: blog._id, adminId });

        return blog;
    }

    // =============================
    // 🔹 UPDATE
    // =============================
    async updateBlog(
        blogId: string,
        adminId: string,
        data: Partial<{
            title: string;
            content: string;
            excerpt: string;
            coverImage: string;
            images: string[];
            category: string;
            tags: string[];
            status: "draft" | "published" | "archived";
            isFeatured: boolean;
        }>
    ) {
        const blog = await Blog.findOne({ _id: blogId, isDeleted: false });
        if (!blog) throw new Error("Blog not found");

        Object.assign(blog, data);
        await blog.save();

        logger.info("Blog updated", { blogId, adminId });

        return blog;
    }

    // =============================
    // 🔹 DELETE (soft delete — keeps the record for audit purposes)
    // =============================
    async deleteBlog(blogId: string) {
        const blog = await Blog.findOne({ _id: blogId, isDeleted: false });
        if (!blog) throw new Error("Blog not found");

        blog.isDeleted = true;
        await blog.save();

        return blog;
    }

    // =============================
    // 🔹 GET ALL (admin sees everything — drafts, archived, etc.)
    // =============================
    async getAllBlogs(query: BlogAdminQuery) {
        const page = Math.max(1, parseInt(query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10));
        const skip = (page - 1) * limit;

        const filter: FilterQuery<IBlog> = { isDeleted: false };

        if (query.status) filter.status = query.status;
        if (query.category) filter.category = query.category;
        if (query.isFeatured !== undefined) filter.isFeatured = query.isFeatured === "true";
        if (query.search) filter.$text = { $search: query.search };

        const sortField = query.sortBy || "createdAt";
        const sortOrder = query.sortOrder === "asc" ? 1 : -1;

        const [blogs, total] = await Promise.all([
            Blog.find(filter)
                .populate("author", "firstName lastName email")
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(limit),
            Blog.countDocuments(filter),
        ]);

        return {
            blogs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    // =============================
    // 🔹 GET ONE
    // =============================
    async getBlogById(blogId: string) {
        const blog = await Blog.findOne({ _id: blogId, isDeleted: false }).populate(
            "author",
            "firstName lastName email"
        );
        if (!blog) throw new Error("Blog not found");
        return blog;
    }

    // =============================
    // 🔹 PUBLISH / UNPUBLISH / ARCHIVE
    // =============================
    async publishBlog(blogId: string) {
        const blog = await Blog.findOne({ _id: blogId, isDeleted: false });
        if (!blog) throw new Error("Blog not found");

        blog.status = "published";
        blog.publicationDate = blog.publicationDate || new Date();
        await blog.save();

        return blog;
    }

    async unpublishBlog(blogId: string) {
        const blog = await Blog.findOne({ _id: blogId, isDeleted: false });
        if (!blog) throw new Error("Blog not found");

        blog.status = "draft";
        await blog.save();

        return blog;
    }

    async archiveBlog(blogId: string) {
        const blog = await Blog.findOne({ _id: blogId, isDeleted: false });
        if (!blog) throw new Error("Blog not found");

        blog.status = "archived";
        await blog.save();

        return blog;
    }

    // =============================
    // 🔹 FEATURE TOGGLE
    // =============================
    async setBlogFeatured(blogId: string, isFeatured: boolean) {
        const blog = await Blog.findOne({ _id: blogId, isDeleted: false });
        if (!blog) throw new Error("Blog not found");

        blog.isFeatured = isFeatured;
        await blog.save();

        return blog;
    }

    // =============================
    // 🔹 STATS
    // =============================
    async getBlogStats(blogId: string) {
        const blog = await Blog.findOne({ _id: blogId, isDeleted: false });
        if (!blog) throw new Error("Blog not found");

        return {
            views: blog.views,
            likes: blog.likes.length,
            status: blog.status,
            readTime: blog.readTime,
            publicationDate: blog.publicationDate,
        };
    }
}

export default BlogAdminService;