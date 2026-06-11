import { Router } from "express";
import { ServiceFeeController } from "../../controllers/serviceChargeController";

const serviceFee = new ServiceFeeController()
const router = Router()

router.get(
    "/",
    serviceFee.getServiceFee
)

export default router