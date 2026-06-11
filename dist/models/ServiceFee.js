"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFeeConfig = void 0;
const mongoose_1 = require("mongoose");
const ServiceFeeSchema = new mongoose_1.Schema({
    category: {
        type: String,
        enum: ["donation", "withdrawal"],
        required: true,
    },
    type: {
        type: String,
        enum: ["percentage", "flat"],
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Admin",
    },
}, {
    timestamps: true,
});
// Only one active config per category
ServiceFeeSchema.index({ category: 1, isActive: 1 });
exports.ServiceFeeConfig = (0, mongoose_1.model)("ServiceFeeConfig", ServiceFeeSchema);
// import mongoose, { Schema, model, Document } from "mongoose";
// export interface IServiceFee extends Document {
//     type: "percentage" | "flat";
//     value: number; // % OR flat amount (NGN)
//     isActive: boolean;
//     effectiveFrom: Date;
//     effectiveTo?: Date;
//     createdBy: mongoose.Types.ObjectId;
// }
// const ServiceFeeSchema = new Schema<IServiceFee>(
//     {
//         type: {
//             type: String,
//             enum: ["percentage", "flat"],
//             required: true,
//         },
//         value: {
//             type: Number,
//             required: true,
//         },
//         isActive: {
//             type: Boolean,
//             default: true,
//         },
//         effectiveFrom: {
//             type: Date,
//             default: Date.now,
//         },
//         effectiveTo: {
//             type: Date,
//         },
//         createdBy: {
//             type: Schema.Types.ObjectId,
//             ref: "Admin",
//         },
//     },
//     { timestamps: true }
// );
// // ensure only one active config
// ServiceFeeSchema.index({ isActive: 1 });
// export const ServiceFeeConfig = model<IServiceFee>(
//     "ServiceFeeConfig",
//     ServiceFeeSchema
// );
