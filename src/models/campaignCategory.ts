import { Schema, model, Document } from "mongoose";

export type CategoryStatus = "active" | "inactive" | "restricted";

export interface CampaignCategoryDocument extends Document {
    categoryName: string;
    description?: string;
    //slug?: string;
    image?: string;              // Cloudinary URL or CDN URL
    status: CategoryStatus;
    listingCount: number;        // Auto-incremented when businesses attach to category
    isDeleted: boolean;          // Soft delete
}

const CampaignCategorySchema = new Schema<CampaignCategoryDocument>(
    {
        categoryName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 100,
            index: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        image: {
            type: String,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "restricted"],
            default: "active",
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
        toObject: { virtuals: true },
    }
    // {
    //     name: {
    //         type: String,
    //         required: true,
    //         trim: true,
    //         unique: true,
    //     },

    //     // slug: {
    //     //     type: String,
    //     //     required: true,
    //     //     unique: true,
    //     // },

    //     image: {
    //         type: String,
    //         default: null,
    //     },

    //     status: {
    //         type: String,
    //         enum: ["active", "inactive", "restricted"],
    //         default: "active",
    //     },

    //     listingCount: {
    //         type: Number,
    //         default: 0,
    //     },

    //     isDeleted: {
    //         type: Boolean,
    //         default: false,
    //     },
    // },
    // { timestamps: true }
);

// Auto-generate slug on name update
// BusinessCategorySchema.pre("save", function (next) {
//     if (this.isModified("name")) {
//         this.slug = this.name.toLowerCase().replace(/ /g, "-");
//     }
//     next();
// });

export const CampaignCategory = model<CampaignCategoryDocument>(
    "CampaignCategory",
    CampaignCategorySchema
);
