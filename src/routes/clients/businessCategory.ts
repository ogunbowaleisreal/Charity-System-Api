import { Router } from "express";
import { CampaignCategoryController } from "../../controllers/client/CampaignCategory";
import { verifyJwt } from "../../middleware/verifyClients";
import { verifyClientToken } from "../../middleware/auth";

const router = Router()
const CampaignCategoryCtrl = new CampaignCategoryController()
//router.use(verifyJwt as any)
//router.use(verifyClientToken)

router.get('/list',
    //verifyJwt,
    CampaignCategoryCtrl.campaignCategory)

export default router