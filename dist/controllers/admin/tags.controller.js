"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagController = void 0;
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const tag_services_1 = require("../../services/admin/tag.services");
class TagController {
    constructor() {
        this.tagService = new tag_services_1.TagService();
        this.createTag = async (req, res) => {
            try {
                const tag = await this.tagService.createTag(req.body, req.admin ? req.admin.id : "");
                (0, helpers_1.sendSuccessResponse)(res, tag, "Tag created successfully");
            }
            catch (error) {
                logger_1.default.error("Create tag failed", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.BAD_REQUEST);
            }
        };
        this.updateTag = async (req, res) => {
            try {
                const tag = await this.tagService.updateTag(req.params.tagId, req.body);
                (0, helpers_1.sendSuccessResponse)(res, tag, "Tag updated successfully");
            }
            catch (error) {
                logger_1.default.error("Update tag failed", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.BAD_REQUEST);
            }
        };
        this.deleteTag = async (req, res) => {
            try {
                const tag = await this.tagService.deleteTag(req.params.tagId);
                (0, helpers_1.sendSuccessResponse)(res, tag, "Tag deleted successfully");
            }
            catch (error) {
                logger_1.default.error("Delete tag failed", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.NOT_FOUND);
            }
        };
        this.getTagById = async (req, res) => {
            try {
                const tag = await this.tagService.getTagById(req.params.tagId);
                (0, helpers_1.sendSuccessResponse)(res, tag, "Tag retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Get tag failed", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.NOT_FOUND);
            }
        };
        this.getAllTags = async (req, res) => {
            try {
                const tags = await this.tagService.getAllTags(req.query);
                (0, helpers_1.sendSuccessResponse)(res, tags, "Tags retrieved successfully");
            }
            catch (error) {
                logger_1.default.error("Get tags failed", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
    }
}
exports.TagController = TagController;
