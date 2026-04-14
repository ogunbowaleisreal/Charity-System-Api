import { Tag } from "../../models/Tags";

export class TagService {
    public async getTags() {
        const tags = await Tag.find({ isActive: true }).populate("createdBy", "name email");
        return tags;
    }
}