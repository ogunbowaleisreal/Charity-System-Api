import { Tag } from "../../models/Tags";
import slugify from "slugify";

/* ---------------------------------- */
/* Create Tag */
/* ---------------------------------- */
export interface CreateTagDTO {
    name: string;
}

/* ---------------------------------- */
/* Update Tag */
/* ---------------------------------- */
export interface UpdateTagDTO {
    name?: string;
    isActive?: boolean;
}

export class TagService {
    public async createTag(data: CreateTagDTO, adminId: string) {
        const name = data.name.trim().toLowerCase();

        const existing = await Tag.findOne({ name });
        if (existing) {
            throw new Error("Tag already exists");
        }

        const tag = await Tag.create({
            name,
            slug: slugify(name, { lower: true }),
            createdBy: adminId
        });

        return tag;
    }

    public async updateTag(tagId: string, data: Partial<{ name: string; isActive: boolean }>) {
        const tag = await Tag.findById(tagId);
        if (!tag) {
            throw new Error("Tag not found");
        }

        if (data.name) {
            const name = data.name.trim().toLowerCase();
            tag.name = name;
            tag.slug = slugify(name, { lower: true });
        }

        if (typeof data.isActive === "boolean") {
            tag.isActive = data.isActive;
        }

        await tag.save();
        return tag;
    }

    public async deleteTag(tagId: string) {
        const tag = await Tag.findByIdAndDelete(tagId);
        if (!tag) {
            throw new Error("Tag not found or already deleted");
        }
        return tag;
    }

    public async getTagById(tagId: string) {
        const tag = await Tag.findById(tagId).populate("createdBy", "name email");
        if (!tag) {
            throw new Error("Tag not found");
        }
        return tag;
    }

    public async getAllTags(filters: Record<string, any>) {
        const query: Record<string, any> = {};

        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive === "true";
        }

        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 20;
        const skip = (page - 1) * limit;

        const [tags, total] = await Promise.all([
            Tag.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Tag.countDocuments(query)
        ]);

        return {
            data: tags,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        };
    }
}
