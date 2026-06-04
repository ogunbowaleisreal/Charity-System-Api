"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const GratuityConfigSchema = new mongoose_1.Schema({
    isEnabled: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    suggestedPercentages: {
        type: [Number],
        default: [5, 10, 15],
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("GratuityConfig", GratuityConfigSchema);
