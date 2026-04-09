import mongoose, { Document, Schema } from "mongoose";
import { Category } from "./Category";

export interface IFAQ extends Document {
    question: string;
    answer: string;
    category: "Account" | "User" | "Vendor" | "Subscription" | "General";
    isPublished: boolean;
}

const FAQSchema = new Schema<IFAQ>(
    {
        question: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        answer: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        category: {
            type: String,
            required: true,
            trim: true,
            index: true,
            validate: {
                validator: async function (value: string) {
                    const category = await Category.findOne({ categoryName: value });
                    return !!category;
                },
                message: "category not found: category does not exist",
            },
        },
        isPublished: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Text index for search
FAQSchema.index({ question: "text", answer: "text" });

export const FAQ = mongoose.model<IFAQ>("FAQ", FAQSchema);
