import { Router } from "express";
import adminRoutes from "./admin/index.route";
import clientRoutes from "./clients/index.route";
import mediaRoutes from "./media";

const router = Router();

router.use('/admin', adminRoutes);
router.use('/client', clientRoutes);
router.use('/media', mediaRoutes);

export default router;