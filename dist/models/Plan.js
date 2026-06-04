"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PlanSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    amount: { type: Number, required: true },
    interval: { type: String, enum: ["monthly", "annually", "daily", "hourly"], required: true },
    currency: { type: String, default: "NGN" },
    features: {
        type: [String],
        default: []
    },
    //type: { type: String, required: false, enum: ["Essential", "Growth", "premium"] },
    paystackPlanCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    amountInKobo: { type: Number, required: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Plan", PlanSchema);
