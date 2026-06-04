"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BidsSchema = new mongoose_1.Schema({
    //clientId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    consultantId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Account", required: true },
    requestId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Request", required: true },
    reason: { type: String },
    availabilityConfimation: { type: Boolean, default: false, required: true },
    termsConfirmation: { type: Boolean, default: false, required: true },
    workType: { type: [String], enum: ["Physical", "Remote", "Hybrid"], required: true },
    approvedBy: { type: String, required: false, default: null },
    declinedBy: { type: String, required: false, default: null },
    experienceLevel: { type: String, enum: ["Intern", "Junior", "Intermediate", "Senior", "Executive"] },
    //amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "accepted", "declined", "assigned"], default: "pending" },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Bids", BidsSchema);
