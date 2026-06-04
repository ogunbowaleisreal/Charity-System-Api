"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagController = void 0;
const tags_service_1 = require("../../services/client/tags.service");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const tagService = new tags_service_1.TagService();
class TagController {
    async getAllTags(req, res, next) {
        try {
            const tags = await tagService.getTags();
            return (0, helpers_1.sendSuccessResponse)(res, { tags });
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
}
exports.TagController = TagController;
