import { Router } from "express";
import { PlanController } from "../../controllers/client/planController";
import { verifyJwt } from "../../middleware/verifyClients";
import { verifyClientToken } from "../../middleware/auth";

const router = Router()
const planCtrl = new PlanController()
router.use(verifyClientToken as any)

//router.post('/create', planCtrl.createPlan)
router.get('/get', planCtrl.getPlanByCode)
router.get('/list', planCtrl.listPlans)

export default router