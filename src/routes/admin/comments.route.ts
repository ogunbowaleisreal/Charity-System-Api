import { Router } from "express"
import { CommentController } from "../../controllers/admin/commentController";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { authorize } from "../../middleware/adminAuth";
const router = Router();
const controller = new CommentController();
router.use(verifyAdminToken);

router.get("/user/:user_id",
    authorize([ADMIN_PERMISSIONS.COMMENTS.VIEW]) as any,
    controller.getUserComments);

export default router