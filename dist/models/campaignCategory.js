"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignCategory = void 0;
const mongoose_1 = require("mongoose");
const CampaignCategorySchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
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
exports.CampaignCategory = (0, mongoose_1.model)("CampaignCategory", CampaignCategorySchema);
