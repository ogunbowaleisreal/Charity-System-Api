"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFeeConfig = void 0;
const mongoose_1 = require("mongoose");
const ServiceFeeSchema = new mongoose_1.Schema({
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
    effectiveFrom: {
        type: Date,
        default: Date.now,
    },
    effectiveTo: {
        type: Date,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Admin",
    },
}, { timestamps: true });
// ensure only one active config
ServiceFeeSchema.index({ isActive: 1 });
exports.ServiceFeeConfig = (0, mongoose_1.model)("ServiceFeeConfig", ServiceFeeSchema);
