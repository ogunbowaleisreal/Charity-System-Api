import { Router } from 'express';
//import { AdminAuthenticatedRequest } from '@/types';
import { HTTP_STATUS } from '../../utils/constants';
import { sendErrorResponse, sendSuccessResponse } from '../../utils/helpers';
//import Joi from 'joi';
import { Contact } from '../../models/Contact';
import { rateLimiter } from '../../middleware/ratelimiter';
import logger from '../../logger';
import { formatToLocal } from '../admin/contact';
import { verifyClientToken } from '../../middleware/auth';
//import Jobs from '@/models/Jobs';

const router = Router();
//router.use(verifyClientToken)
router.use(rateLimiter.general)

router.get("/", async (req, res) => {
    try {
        const result = await Contact.findOne({});

        if (!result) {
            sendErrorResponse(
                res,
                "Kindly create contact information first",
                HTTP_STATUS.NOT_FOUND
            );
            return;
        }

        // await Jobs.deleteMany({});
        console.log(result.toObject())

        const formattedContact = {
            ...result.toObject(),
            phoneNumber: formatToLocal(result.phoneNumber),
            whatsappNumber: formatToLocal(result.whatsappNumber),
        };

        sendSuccessResponse(
            res,
            formattedContact,
            "Contact information retrieved successfully"
        );
    } catch (error: any) {
        sendErrorResponse(
            res,
            "Error retrieving contact information",
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
        logger.error("Error retrieving contact information", {
            error: error.message
        });
    }
});
export default router;