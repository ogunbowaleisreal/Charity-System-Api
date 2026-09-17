import { Router } from "express";
import { BlogController } from "../../controllers/client/Blogs.controller";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const blogCtrl = new BlogController();

router.use(rateLimiter.general);

// =========================================================
// 📰 PUBLIC — no auth required to browse/read blogs
// =========================================================

router.get("/", blogCtrl.getAllBlogs);

router.get("/featured", blogCtrl.getFeaturedBlogs);

router.get("/:slug", blogCtrl.getBlogBySlug);

// =========================================================
// ❤️ REQUIRES AUTH
// =========================================================

router.post("/:blogId/like", verifyClientToken as any, blogCtrl.toggleLike);

export default router;