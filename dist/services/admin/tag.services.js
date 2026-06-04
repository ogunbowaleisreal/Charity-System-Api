"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagService = void 0;
const Tags_1 = require("../../models/Tags");
const slugify_1 = __importDefault(require("slugify"));
class TagService {
    async createTag(data, adminId) {
        const name = data.name.trim().toLowerCase();
        const existing = await Tags_1.Tag.findOne({ name });
        if (existing) {
            throw new Error("Tag already exists");
        }
        const tag = await Tags_1.Tag.create({
            name,
            slug: (0, slugify_1.default)(name, { lower: true }),
            createdBy: adminId
        });
        return tag;
    }
    async updateTag(tagId, data) {
        const tag = await Tags_1.Tag.findById(tagId);
        if (!tag) {
            throw new Error("Tag not found");
        }
        if (data.name) {
            const name = data.name.trim().toLowerCase();
            tag.name = name;
            tag.slug = (0, slugify_1.default)(name, { lower: true });
        }
        if (typeof data.isActive === "boolean") {
            tag.isActive = data.isActive;
        }
        await tag.save();
        return tag;
    }
    async deleteTag(tagId) {
        const tag = await Tags_1.Tag.findByIdAndDelete(tagId);
        if (!tag) {
            throw new Error("Tag not found or already deleted");
        }
        return tag;
    }
    async getTagById(tagId) {
        const tag = await Tags_1.Tag.findById(tagId).populate("createdBy", "name email");
        if (!tag) {
            throw new Error("Tag not found");
        }
        return tag;
    }
    async getAllTags(filters) {
        const query = {};
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive === "true";
        }
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 20;
        const skip = (page - 1) * limit;
        const [tags, total] = await Promise.all([
            Tags_1.Tag.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Tags_1.Tag.countDocuments(query)
        ]);
        return {
            data: tags,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        };
    }
}
exports.TagService = TagService;
