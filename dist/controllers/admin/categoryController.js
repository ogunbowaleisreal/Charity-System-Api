"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const categoryService_1 = require("../../services/admin/categoryService");
class CategoryController {
    constructor() {
        this.categoryService = new categoryService_1.CategoryService();
        this.getAllCategories = async (req, res) => {
            try {
                const result = await this.categoryService.getAllCategories(req.query);
                (0, helpers_1.sendSuccessResponse)(res, result, "Categories retrieved successfully");
                logger_1.default.info("Admin retrieved categories", {
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                    totalCount: result.pagination.totalPages,
                    page: req.query.page || 1,
                });
            }
            catch (error) {
                logger_1.default.error("Failed to retrieve categories", {
                    error: error.message,
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                    query: req.query,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.getCategoryById = async (req, res) => {
            try {
                const category = await this.categoryService.getCategoryById(req.params.id);
                (0, helpers_1.sendSuccessResponse)(res, category, "Category retrieved successfully");
                logger_1.default.info("Admin retrieved category by ID", {
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                    categoryId: req.params.id,
                });
            }
            catch (error) {
                logger_1.default.error("Failed to retrieve category by ID", {
                    error: error.message,
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                    categoryId: req.params.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.createCategory = async (req, res) => {
            try {
                const category = await this.categoryService.createCategory(req.body);
                (0, helpers_1.sendSuccessResponse)(res, category, "Category created successfully", constants_1.HTTP_STATUS.CREATED);
                logger_1.default.info("Admin created category", {
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                    categoryId: category.id,
                    categoryName: category.categoryName,
                });
            }
            catch (error) {
                logger_1.default.error("Failed to create category", {
                    error: error.message,
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                    categoryData: req.body,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.updateCategory = async (req, res) => {
            try {
                const category = await this.categoryService.updateCategory(req.params.id, req.body);
                (0, helpers_1.sendSuccessResponse)(res, category, "Category updated successfully");
                logger_1.default.info("Admin updated category", {
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                    categoryId: req.params.id,
                    updateData: req.body,
                });
            }
            catch (error) {
                logger_1.default.error("Failed to update category", {
                    error: error.message,
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                    categoryId: req.params.id,
                    updateData: req.body,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.deleteCategory = async (req, res) => {
            try {
                await this.categoryService.deleteCategory(req.params.id);
                (0, helpers_1.sendSuccessResponse)(res, null, "Category deleted successfully");
                logger_1.default.info("Admin deleted category", {
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                    categoryId: req.params.id,
                });
            }
            catch (error) {
                logger_1.default.error("Failed to delete category", {
                    error: error.message,
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                    categoryId: req.params.id,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.updateCategoryStatus = async (req, res) => {
            try {
                const category = await this.categoryService.updateCategoryStatus(req.params.id, req.body.status);
                (0, helpers_1.sendSuccessResponse)(res, category, "Category status updated successfully");
                logger_1.default.info("Admin updated category status", {
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                    categoryId: req.params.id,
                    newStatus: req.body.status,
                });
            }
            catch (error) {
                logger_1.default.error("Failed to update category status", {
                    error: error.message,
                    adminId: req.admin?.id,
                    adminEmail: req.admin?.email,
                    categoryId: req.params.id,
                    status: req.body.status,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        // getCategoriesWithSubcategoriesCount = async (
        //     req: AdminAuthenticatedRequest,
        //     res: Response
        // ): Promise<void> => {
        //     try {
        //         const result =
        //             await this.categoryService.getCategoriesWithSubcategoriesCount(
        //                 req.query
        //             );
        //         sendSuccessResponse(
        //             res,
        //             result,
        //             "Categories with subcategories count retrieved successfully"
        //         );
        //         logger.info("Admin retrieved categories with subcategories count", {
        //             adminId: req.admin?.id,
        //             adminEmail: req.admin?.email,
        //             totalCount: result.total,
        //         });
        //     } catch (error: any) {
        //         logger.error("Failed to retrieve categories with subcategories count", {
        //             error: error.message,
        //             adminId: req.admin?.id,
        //             adminEmail: req.admin?.email,
        //             query: req.query,
        //         });
        //         sendErrorResponse(
        //             res,
        //             error.message,
        //             error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
        //         );
        //     }
        // };
    }
}
exports.CategoryController = CategoryController;
