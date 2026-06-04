"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQController = void 0;
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const faqServices_1 = require("../../services/client/faqServices");
class FAQController {
    constructor() {
        this.faqService = new faqServices_1.FAQService();
        this.getAllFAQs = async (req, res) => {
            try {
                const result = await this.faqService.getAllFAQs(req.query);
                (0, helpers_1.sendSuccessResponse)(res, result, "FAQs retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to get FAQs", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
    }
}
exports.FAQController = FAQController;
