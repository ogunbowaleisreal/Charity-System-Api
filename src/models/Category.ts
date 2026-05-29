import mongoose, { Document, ObjectId, Schema, Types } from "mongoose";

export interface ICategory extends Document {
    categoryName: string;
    description?: string;
    image?: string;
    status: "active" | "inactive" | "restricted";
    createdAt?: Date;
    updatedAt?: Date;
    __v: number;
}

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

const categorySchema = new Schema<ICategory>(
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
);

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

export const Category = mongoose.model<ICategory>("Category", categorySchema);
// export const Subcategory = mongoose.model<ISubcategory>(
//     "Subcategory",
//     subcategorySchema
// );
