import { Schema, model, Types } from "mongoose";

export interface IBankDetail {
    user: Types.ObjectId;

    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;

    isDeleted: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const bankDetailSchema = new Schema<IBankDetail>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: true,
            index: true,
        },

        bankName: {
            type: String,
            required: true,
            trim: true,
        },

        accountNumber: {
            type: String,
            required: true,
            trim: true,
        },

        accountName: {
            type: String,
            required: true,
            trim: true,
        },

        bankCode: {
            type: String,
            required: true,
            trim: true,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export const BankDetail = model<IBankDetail>(
    "BankDetail",
    bankDetailSchema
);