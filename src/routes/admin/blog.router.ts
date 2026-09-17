import { Router } from "express";
import { BlogAdminController } from "../../controllers/admin/Blogs.controller";
import { verifyAdminToken, authorize } from "../../middleware/adminAuth";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const blogCtrl = new BlogAdminController();

// =========================
// GLOBAL MIDDLEWARE
// =========================
router.use(verifyAdminToken as any);
router.use(rateLimiter.general);

// =========================
// 📊 GET ALL BLOGS
// =========================
router.get(
    "/all-blogs",
    authorize([ADMIN_PERMISSIONS.BLOG.VIEW]) as any,
    blogCtrl.getAllBlogs
);

// =========================
// 🎯 GET BLOG DETAILS
// =========================
router.get(
    "/details/:blogId",
    authorize([ADMIN_PERMISSIONS.BLOG.VIEW]) as any,
    blogCtrl.getBlogById
);

// =========================
// 📈 STATS
// =========================
router.get(
    "/stats/:blogId",
    authorize([ADMIN_PERMISSIONS.BLOG.VIEW]) as any,
    blogCtrl.getBlogStats
);

// =========================
// ✍️ CREATE BLOG
// =========================
router.post(
    "/create",
    authorize([ADMIN_PERMISSIONS.BLOG.CREATE]) as any,
    blogCtrl.createBlog
);

// =========================
// 📝 UPDATE BLOG
// =========================
router.put(
    "/update/:blogId",
    authorize([ADMIN_PERMISSIONS.BLOG.UPDATE]) as any,
    blogCtrl.updateBlog
);

// =========================
// 🗑️ DELETE BLOG
// =========================
router.delete(
    "/delete/:blogId",
    authorize([ADMIN_PERMISSIONS.BLOG.DELETE]) as any,
    blogCtrl.deleteBlog
);

// =========================
// 📢 PUBLISH / UNPUBLISH / ARCHIVE
// =========================
router.post(
    "/publish/:blogId",
    authorize([ADMIN_PERMISSIONS.BLOG.UPDATE]) as any,
    blogCtrl.publishBlog
);

router.post(
    "/unpublish/:blogId",
    authorize([ADMIN_PERMISSIONS.BLOG.UPDATE]) as any,
    blogCtrl.unpublishBlog
);

router.post(
    "/archive/:blogId",
    authorize([ADMIN_PERMISSIONS.BLOG.UPDATE]) as any,
    blogCtrl.archiveBlog
);

// =========================
// ⭐ FEATURE TOGGLE
// =========================
router.post(
    "/set-featured/:blogId",
    authorize([ADMIN_PERMISSIONS.BLOG.UPDATE]) as any,
    blogCtrl.setBlogFeatured
);

export default router;