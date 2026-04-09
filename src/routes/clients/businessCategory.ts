import { Router } from "express";
import { BusinessCategoryController } from "../../controllers/client/businessCategory";
import { verifyJwt } from "../../middleware/verifyClients";
import { verifyClientToken } from "../../middleware/auth";

const router = Router()
const businessCategoryCtrl = new BusinessCategoryController()
//router.use(verifyJwt as any)
//router.use(verifyClientToken)

router.get('/list',
    //verifyJwt,
    businessCategoryCtrl.businessCategory)

export default router