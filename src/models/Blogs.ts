import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface IBlog extends Document {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    images?: string[];
    category?: string;
    tags?: string[];
    author: Types.ObjectId;
    status: "draft" | "published" | "archived";
    publicationDate?: Date;
    isFeatured: boolean;
    views: number;
    likes: Types.ObjectId[];
    readTime: number; // in minutes
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        content: {
            type: String,
            required: true,
        },
        excerpt: {
            type: String,
            maxlength: 300,
        },
        coverImage: {
            type: String, // just the URL, as requested
        },
        images: {
            type: [String],
            default: [],
        },
        category: {
            type: String,
            trim: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
        },
        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft",
        },
        publicationDate: {
            type: Date,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        views: {
            type: Number,
            default: 0,
        },
        likes: {
            type: [Schema.Types.ObjectId],
            ref: "Account",
            default: [],
        },
        readTime: {
            type: Number,
            default: 1,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// ===== helpers =====
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// auto-generate slug, excerpt, and read time so admins don't have to think about it
BlogSchema.pre("validate", function (this: IBlog, next) {
    if (this.isModified("title") || !this.slug) {
        const base = slugify(this.title);
        this.slug = `${base}-${Date.now().toString(36)}`;
    }

    if (!this.excerpt && this.content) {
        const plain = this.content.replace(/<[^>]*>/g, "");
        this.excerpt = plain.length > 180 ? `${plain.slice(0, 180)}...` : plain;
    }

    if (this.content) {
        const words = this.content
            .replace(/<[^>]*>/g, "")
            .split(/\s+/)
            .filter(Boolean).length;
        this.readTime = Math.max(1, Math.ceil(words / 200));
    }

    if (this.status === "published" && !this.publicationDate) {
        this.publicationDate = new Date();
    }

    next();
});

BlogSchema.index({ title: "text", content: "text", tags: "text" });
BlogSchema.index({ status: 1, isDeleted: 1, publicationDate: -1 });

BlogSchema.set("toJSON", {
    transform: function (doc, ret: any) {
        delete ret.__v;
        return ret;
    },
});

export const Blog = model<IBlog>("Blog", BlogSchema);