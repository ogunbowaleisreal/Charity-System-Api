"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQController = void 0;
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const faqService_1 = require("../../services/admin/faqService");
class FAQController {
    constructor() {
        this.faqService = new faqService_1.FAQService();
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
        this.getFAQById = async (req, res) => {
            try {
                const faq = await this.faqService.getFAQById(req.params.id);
                (0, helpers_1.sendSuccessResponse)(res, faq, "FAQ retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to get FAQ by ID", {
                    error: error.message,
                    faqId: req.params.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.createFAQ = async (req, res) => {
            try {
                const adminId = req.admin?.id;
                if (!adminId) {
                    (0, helpers_1.sendErrorResponse)(res, "Unauthorized", constants_1.HTTP_STATUS.UNAUTHORIZED);
                    return;
                }
                const faq = await this.faqService.createFAQ(req.body);
                logger_1.default.info("FAQ created", {
                    faqId: faq._id.toString(),
                    createdBy: adminId,
                    category: faq.category,
                });
                (0, helpers_1.sendSuccessResponse)(res, faq, "FAQ created successfully", constants_1.HTTP_STATUS.CREATED);
            }
            catch (error) {
                logger_1.default.error("Failed to create FAQ", {
                    error: error.message,
                    createdBy: req.admin?.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.updateFAQ = async (req, res) => {
            try {
                const adminId = req.admin?.id;
                if (!adminId) {
                    (0, helpers_1.sendErrorResponse)(res, "Unauthorized", constants_1.HTTP_STATUS.UNAUTHORIZED);
                    return;
                }
                const faq = await this.faqService.updateFAQ(req.params.id, req.body);
                logger_1.default.info("FAQ updated", {
                    faqId: req.params.id,
                    updatedBy: adminId,
                });
                (0, helpers_1.sendSuccessResponse)(res, faq, "FAQ updated successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to update FAQ", {
                    error: error.message,
                    faqId: req.params.id,
                    updatedBy: req.admin?.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.deleteFAQ = async (req, res) => {
            try {
                const adminId = req.admin?.id;
                if (!adminId) {
                    (0, helpers_1.sendErrorResponse)(res, "Unauthorized", constants_1.HTTP_STATUS.UNAUTHORIZED);
                    return;
                }
                await this.faqService.deleteFAQ(req.params.id);
                logger_1.default.info("FAQ deleted", {
                    faqId: req.params.id,
                    deletedBy: adminId,
                });
                (0, helpers_1.sendSuccessResponse)(res, null, "FAQ deleted successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to delete FAQ", {
                    error: error.message,
                    faqId: req.params.id,
                    deletedBy: req.admin?.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.getFAQStatistics = async (req, res) => {
            try {
                const statistics = await this.faqService.getFAQStatistics();
                (0, helpers_1.sendSuccessResponse)(res, statistics, "FAQ statistics retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to get FAQ statistics", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.getFAQCategories = async (req, res) => {
            try {
                const categories = await this.faqService.getFAQCategories();
                (0, helpers_1.sendSuccessResponse)(res, categories, "FAQ categories retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to get FAQ categories", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
    }
}
exports.FAQController = FAQController;
