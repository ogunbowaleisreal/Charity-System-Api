"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
//import { AdminAuthenticatedRequest } from '@/types';
const constants_1 = require("../../utils/constants");
const helpers_1 = require("../../utils/helpers");
//import Joi from 'joi';
const Contact_1 = require("../../models/Contact");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const logger_1 = __importDefault(require("../../logger"));
const contact_1 = require("../admin/contact");
//import Jobs from '@/models/Jobs';
const router = (0, express_1.Router)();
//router.use(verifyClientToken)
router.use(ratelimiter_1.rateLimiter.general);
router.get("/", async (req, res) => {
    try {
        const result = await Contact_1.Contact.findOne({});
        if (!result) {
            (0, helpers_1.sendErrorResponse)(res, "Kindly create contact information first", constants_1.HTTP_STATUS.NOT_FOUND);
            return;
        }
        // await Jobs.deleteMany({});
        console.log(result.toObject());
        const formattedContact = {
            ...result.toObject(),
            phoneNumber: (0, contact_1.formatToLocal)(result.phoneNumber),
            whatsappNumber: (0, contact_1.formatToLocal)(result.whatsappNumber),
        };
        (0, helpers_1.sendSuccessResponse)(res, formattedContact, "Contact information retrieved successfully");
    }
    catch (error) {
        (0, helpers_1.sendErrorResponse)(res, "Error retrieving contact information", constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        logger_1.default.error("Error retrieving contact information", {
            error: error.message
        });
    }
});
exports.default = router;
