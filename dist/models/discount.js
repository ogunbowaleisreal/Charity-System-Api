"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PlanDiscountSchema = new mongoose_1.Schema({
    planId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Plan", required: true },
    percentage: { type: Number, min: 1, max: 100, required: true },
    active: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date,
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("PlanDiscount", PlanDiscountSchema);
