"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const RequestSchema = new mongoose_1.Schema({
    admin: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin", required: true },
    //client: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    businessCategory: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessCategory", required: true },
    companyIndustry: { type: String },
    amount: { type: Number, required: true },
    name: { type: String, required: true },
    //email: { type: String, required: true },
    message: { type: String, required: true },
    //jobTime: { type: String, required: true },
    //requiredHrCount: { type: Number, required: true },
    //approvedHrCount: { type: Number, default: 0 },
    // assignedHRCount: { type: Number, default: 0 },
    // assignedHRCount: {
    //     type: Number,
    //     default: 0,
    //     min: 0,
    //     validate: {
    //         validator: function (v) {
    //             return v <= this.requiredHrCount;
    //         },
    //         message: "assignedHRCount cannot exceed requiredHrCount"
    //     }
    // }
    //,
    workType: { type: [String], required: true, enum: ["Physical", "Remote", "Hybrid"] },
    status: {
        type: String, enum: [
            "pending",
            // "accepted",
            "ongoing",
            //  "partially completed",
            // "completed",
            "ended"
        ], default: "pending"
    },
    // jobDuration: {
    //     value: { type: Number, required: true }, // e.g. 3
    //     unit: {
    //         type: String,
    //         enum: ["days", "weeks", "months"],
    //         required: true
    //     }
    // },
    //assignedHR: { type: Schema.Types.ObjectId, ref: "Account", required: true, default: null },
    biddingStartDate: { type: Date, default: Date.now },
    experienceLevel: { type: String, enum: ["Intern", "Junior", "Intermediate", "Senior", "Executive"], required: true },
    biddingEndDate: { type: Date }
}, { timestamps: true });
RequestSchema.index({ createdAt: -1, _id: -1 });
exports.default = (0, mongoose_1.model)("Request", RequestSchema);
