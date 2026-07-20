"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gratuity = void 0;
const mongoose_1 = require("mongoose");
const GratuitySchema = new mongoose_1.Schema({
    amount: {
        type: Number,
        required: true,
    },
    percentage: {
        type: Number,
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    transactionReference: {
        type: String,
        required: true,
        index: true,
    },
    fullName: {
        type: String
    },
    campaign: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Campaign",
    },
    // purposeTitle: {
    //     type: String,
    //     required: true,
    // },
    source: {
        type: String,
        enum: ["donation"],
        default: "donation",
    },
    currency: {
        type: String,
        default: "NGN",
    },
}, { timestamps: true });
exports.Gratuity = (0, mongoose_1.model)("Gratuity", GratuitySchema);
