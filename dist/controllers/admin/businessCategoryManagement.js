"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessCategoryController = void 0;
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const businessCategoryManagement_1 = require("../../services/admin/businessCategoryManagement");
class BusinessCategoryController {
    constructor() {
        this.categoryService = new businessCategoryManagement_1.BusinessCategoryService();
        // -------------------------------------------
        // CREATE CATEGORY
        // -------------------------------------------
        this.createBusinessCategory = async (req, res) => {
            try {
                const adminId = req.admin?.adminId;
                if (!adminId) {
                    (0, helpers_1.sendErrorResponse)(res, "Unauthorized", constants_1.HTTP_STATUS.UNAUTHORIZED);
                    return;
                }
                const category = await this.categoryService.createCategory(req.body);
                if (!category || !category._id)
                    throw new Error("there was an error creating the category");
                logger_1.default.info("Category created", {
                    categoryId: category._id.toString(),
                    createdBy: adminId,
                });
                (0, helpers_1.sendSuccessResponse)(res, category, "Category created successfully", constants_1.HTTP_STATUS.CREATED);
            }
            catch (error) {
                logger_1.default.error("Failed to create category", {
                    error: error.message,
                    adminId: req.admin?.adminId,
                    payload: req.body,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        // -------------------------------------------
        // GET ALL CATEGORIES
        // -------------------------------------------
        this.getAllBusinessCategories = async (req, res) => {
            try {
                const categories = await this.categoryService.getAllCategories(req.query);
                (0, helpers_1.sendSuccessResponse)(res, categories, "Categories retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to get categories", {
                    error: error.message,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        // -------------------------------------------
        // GET CATEGORY BY ID
        // -------------------------------------------
        this.getBusinessCategoryById = async (req, res) => {
            try {
                const { categoryId } = req.params;
                const category = await this.categoryService.getCategoryById(categoryId);
                (0, helpers_1.sendSuccessResponse)(res, { category }, "Category retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to get category", {
                    categoryId: req.params.categoryId,
                    error: error.message,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        // -------------------------------------------
        // UPDATE CATEGORY
        // -------------------------------------------
        this.updateBusinessCategory = async (req, res) => {
            try {
                const adminId = req.admin?.adminId;
                if (!adminId) {
                    (0, helpers_1.sendErrorResponse)(res, "Unauthorized", constants_1.HTTP_STATUS.UNAUTHORIZED);
                    return;
                }
                const { categoryId } = req.params;
                const updatedCategory = await this.categoryService.updateCategory(categoryId, req.body);
                logger_1.default.info("Category updated", {
                    categoryId,
                    updatedBy: adminId,
                    updates: Object.keys(req.body),
                });
                (0, helpers_1.sendSuccessResponse)(res, { category: updatedCategory }, "Category updated successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to update category", {
                    categoryId: req.params.categoryId,
                    error: error.message,
                    updatedBy: req.admin?.adminId,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        // -------------------------------------------
        // DELETE CATEGORY
        // -------------------------------------------
        this.deleteBusinessCategory = async (req, res) => {
            try {
                const adminId = req.admin?.adminId;
                if (!adminId) {
                    (0, helpers_1.sendErrorResponse)(res, "Unauthorized", constants_1.HTTP_STATUS.UNAUTHORIZED);
                    return;
                }
                const { categoryId } = req.params;
                await this.categoryService.deleteCategory(categoryId);
                logger_1.default.info("Category deleted", {
                    categoryId,
                    deletedBy: adminId,
                });
                (0, helpers_1.sendSuccessResponse)(res, null, "Category deleted successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to delete category", {
                    categoryId: req.params.categoryId,
                    error: error.message,
                    deletedBy: req.admin?.adminId,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        // -------------------------------------------
        // UPDATE STATUS (active / inactive / restricted)
        // -------------------------------------------
        this.updateBusinessCategoryStatus = async (req, res) => {
            try {
                const adminId = req.admin?.adminId;
                if (!adminId) {
                    (0, helpers_1.sendErrorResponse)(res, "Unauthorized", constants_1.HTTP_STATUS.UNAUTHORIZED);
                    return;
                }
                const { categoryId } = req.params;
                const { status } = req.body;
                const updated = await this.categoryService.updateCategoryStatus(categoryId, status);
                logger_1.default.info("Category status updated", {
                    categoryId,
                    newStatus: status,
                    updatedBy: adminId,
                });
                (0, helpers_1.sendSuccessResponse)(res, { category: updated }, "Category status updated successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to update category status", {
                    categoryId: req.params.categoryId,
                    error: error.message,
                    updatedBy: req.admin?.adminId,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
    }
}
exports.BusinessCategoryController = BusinessCategoryController;
