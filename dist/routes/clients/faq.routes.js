"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
//import { validateRequest } from "../../middleware/validation"
const ratelimiter_1 = require("../../middleware/ratelimiter");
//import { faqQueryValidation } from "@/validations/admin/faqValidation"
const faqController_1 = require("../../controllers/client/faqController");
const faqController = new faqController_1.FAQController;
const router = (0, express_1.default)();
router.use(ratelimiter_1.rateLimiter.general);
//router.use(verifyClientToken)
router.get("/", 
//validateRequest(faqQueryValidation),
faqController.getAllFAQs);
exports.default = router;
