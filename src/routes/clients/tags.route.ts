import { Router } from "express";
import { TagController } from "../../controllers/client/tags.controller";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const tagController = new TagController();

router.use(rateLimiter.general);
router.use(verifyClientToken);

router.get("/", tagController.getAllTags);

export default router;