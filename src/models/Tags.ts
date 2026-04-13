import { Schema, model, Types } from "mongoose";

/* ---------------------------------- */
/* Tag Core Model Shape */
/* ---------------------------------- */

export interface ITag {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    isActive: boolean;
    createdBy: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}


const TagSchema = new Schema<ITag>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        slug: {
            type: String,
            required: true,
            unique: true
        },

        isActive: {
            type: Boolean,
            default: true
        },

        createdBy: {
            type: Types.ObjectId,
            ref: "Admin", // admin
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Tag = model("Tag", TagSchema);
