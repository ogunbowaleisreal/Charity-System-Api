import { Blog, IBlog } from "../../models/Blogs";
import { FilterQuery } from "mongoose";

interface BlogQuery {
    page?: string | number;
    limit?: string | number;
    search?: string;
    category?: string;
    tag?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export class BlogService {
    // =============================
    // 🔹 GET ALL (public — published only)
    // =============================
    async getAllBlogs(query: BlogQuery) {
        const page = Math.max(1, parseInt(query.page as string) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 10));
        const skip = (page - 1) * limit;

        const filter: FilterQuery<IBlog> = {
            isDeleted: false,
            status: "published",
        };

        if (query.category) filter.category = query.category;
        if (query.tag) filter.tags = query.tag;
        if (query.search) filter.$text = { $search: query.search };

        const sortField = query.sortBy || "publicationDate";
        const sortOrder = query.sortOrder === "asc" ? 1 : -1;

        const [blogs, total] = await Promise.all([
            Blog.find(filter)
                .select("-likes")
                .populate("author", "firstName lastName profilePicture")
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
    // 🔹 GET FEATURED
    // =============================
    async getFeaturedBlogs(query: BlogQuery) {
        const limit = Math.min(20, Math.max(1, parseInt(query.limit as string) || 5));

        const blogs = await Blog.find({
            isDeleted: false,
            status: "published",
            isFeatured: true,
        })
            .select("-likes")
            .populate("author", "firstName lastName profilePicture")
            .sort({ publicationDate: -1 })
            .limit(limit);

        return blogs;
    }

    // =============================
    // 🔹 GET ONE (by slug) — also bumps the view count
    // =============================
    async getBlogBySlug(slug: string) {
        const blog = await Blog.findOneAndUpdate(
            { slug, isDeleted: false, status: "published" },
            { $inc: { views: 1 } },
            { new: true }
        ).populate("author", "firstName lastName profilePicture");

        if (!blog) throw new Error("Blog not found");

        return blog;
    }

    // =============================
    // 🔹 LIKE / UNLIKE (toggle)
    // =============================
    async toggleLike(blogId: string, userId: string) {
        const blog = await Blog.findOne({
            _id: blogId,
            isDeleted: false,
            status: "published",
        });
        if (!blog) throw new Error("Blog not found");

        const alreadyLiked = blog.likes.some((id) => id.toString() === userId);

        if (alreadyLiked) {
            blog.likes = blog.likes.filter((id) => id.toString() !== userId) as any;
        } else {
            blog.likes.push(userId as any);
        }

        await blog.save();

        return {
            liked: !alreadyLiked,
            totalLikes: blog.likes.length,
        };
    }
}

export default BlogService;