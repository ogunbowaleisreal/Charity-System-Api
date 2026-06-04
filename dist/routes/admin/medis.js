"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const imagekitServices_1 = require("../../services/imagekitServices");
const adminAuth_1 = require("../../middleware/adminAuth");
//import { validateRequest } from "@/middleware/validation";
//import { mediaSchemaValidation } from "@/validations/mediaValidation";
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const router = (0, express_1.Router)();
const imagekitService = new imagekitServices_1.ImageKitService();
router.use(adminAuth_1.verifyAdminToken);
// Get ImageKit signature for frontend uploads
router.get("/signatureWithDetails", 
//validateRequest(mediaSchemaValidation),
async (req, res) => {
    try {
        const { folder, fileName } = req.body;
        const signature = await imagekitService.generateUploadSignatureWithDetails(folder, fileName);
        res.status(200).json(signature);
    }
    catch (error) {
        (0, helpers_1.sendErrorResponse)(res, "Failed to generate signature", constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
router.get("/signature", async (req, res) => {
    try {
        const signature = await imagekitService.generateUploadSignature();
        res.status(200).json(signature);
    }
    catch (error) {
        (0, helpers_1.sendErrorResponse)(res, "Failed to generate signature", constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
exports.default = router;
