"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// export interface ISubcategory extends Document {
//     _id: string;
//     subcategoryName: string;
//     subcategoryImage: string;
//     categoryId: Types.ObjectId;
//     status: "active" | "inactive" | "restricted";
//     createdAt: Date;
//     updatedAt: Date;
//     category?: ICategory;
//     isFeatured?: boolean;
// }
const categorySchema = new mongoose_1.Schema({
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
});
// const subcategorySchema = new Schema<ISubcategory>(
//     {
//         subcategoryName: {
//             type: String,
//             required: true,
//             trim: true,
//             maxlength: 100,
//             index: true,
//         },
//         subcategoryImage: {
//             type: String,
//             trim: true,
//         },
//         categoryId: {
//             type: Schema.Types.ObjectId,
//             ref: "Category",
//             required: true,
//             index: true,
//         },
//         status: {
//             type: String,
//             enum: ["active", "inactive", "restricted"],
//             default: "active",
//             index: true,
//         },
//         isFeatured: {
//             type: Boolean,
//             default: false,
//         },
//     },
//     {
//         timestamps: true,
//         toJSON: {
//             virtuals: true,
//             transform: function (doc, ret) {
//                 ret.id = ret._id;
//                 delete ret._id;
//                 delete ret.__v;
//                 return ret;
//             },
//         },
//         toObject: { virtuals: true },
//     }
// );
// subcategorySchema.virtual("category", {
//     ref: "Category",
//     localField: "categoryId",
//     foreignField: "_id",
//     justOne: true,
// });
categorySchema.virtual("subcategories", {
    ref: "Subcategory",
    localField: "_id",
    foreignField: "categoryId",
});
// Other indexes
categorySchema.index({ categoryName: 1, status: 1 });
categorySchema.index({ status: 1, createdAt: -1 });
// subcategorySchema.index({ categoryId: 1, status: 1 });
// subcategorySchema.index({ status: 1, createdAt: -1 });
// subcategorySchema.index({ subcategoryName: 1, status: 1 });
// categorySchema.pre(
//     "deleteOne",
//     { document: true, query: false },
//     async function (next) {
//         try {
//             await Subcategory.deleteMany({ categoryId: this._id });
//             next();
//         } catch (error) {
//             next(error as Error);
//         }
//     }
// );
exports.Category = mongoose_1.default.model("Category", categorySchema);
// export const Subcategory = mongoose.model<ISubcategory>(
//     "Subcategory",
//     subcategorySchema
// );
