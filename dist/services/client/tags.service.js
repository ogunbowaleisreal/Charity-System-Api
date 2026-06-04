"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagService = void 0;
const Tags_1 = require("../../models/Tags");
class TagService {
    async getTags() {
        const tags = await Tags_1.Tag.find({ isActive: true }).populate("createdBy", "name email");
        return tags;
    }
}
exports.TagService = TagService;
