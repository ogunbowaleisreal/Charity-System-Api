import { Router } from "express";
import { AdminPlanMigrationController } from "../../controllers/admin/adminMigrationPlan";

const router = Router();
const controller = new AdminPlanMigrationController();

// POST /admin/plans/migrate
router.post("/migrate", controller.migratePlan);

export default router;
