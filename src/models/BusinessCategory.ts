import { Schema, model, Document } from "mongoose";

export type CategoryStatus = "active" | "inactive" | "restricted";

export interface BusinessCategoryDocument extends Document {
    name: string;
    //slug?: string;
    image?: string;              // Cloudinary URL or CDN URL
    status: CategoryStatus;
    listingCount: number;        // Auto-incremented when businesses attach to category
    isDeleted: boolean;          // Soft delete
}

const BusinessCategorySchema = new Schema<BusinessCategoryDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },

        // slug: {
        //     type: String,
        //     required: true,
        //     unique: true,
        // },

        image: {
            type: String,
            default: null,
        },

        status: {
            type: String,
            enum: ["active", "inactive", "restricted"],
            default: "active",
        },

        listingCount: {
            type: Number,
            default: 0,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Auto-generate slug on name update
// BusinessCategorySchema.pre("save", function (next) {
//     if (this.isModified("name")) {
//         this.slug = this.name.toLowerCase().replace(/ /g, "-");
//     }
//     next();
// });

export const BusinessCategory = model<BusinessCategoryDocument>(
    "BusinessCategory",
    BusinessCategorySchema
);
