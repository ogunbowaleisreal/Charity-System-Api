"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
//import { required } from "zod/v4/core/util.cjs";
const ConsultantClientAssignmentSchema = new mongoose_1.Schema({
    consultant: {
        type: mongoose_1.Types.ObjectId,
        ref: "Account", // consultant account
        required: true,
    },
    client: {
        type: mongoose_1.Types.ObjectId,
        ref: "Account", // client account
        required: true,
    },
    bidId: {
        type: mongoose_1.Types.ObjectId,
        ref: "Bids",
        //required: true
    },
    consultantProfile: {
        type: mongoose_1.Types.ObjectId,
        ref: "ConsultantProfile",
        required: true,
    },
    clientProfile: {
        type: mongoose_1.Types.ObjectId,
        ref: "ClientProfile",
        required: true,
    },
    // request: {
    //     type: Types.ObjectId,
    //     ref: "Request",
    //     required: true
    // },
    // type: {
    //     type: String,
    //     enum: ["bidRelated", "direct"],
    //     required: true,
    // },
    // completionStatus: {
    //     type: String,
    //     enum: ["inProgress", "ended"],
    //     default: "inProgress"
    // },
    // jobEndDate: {
    //     type: Date,
    //     required: true,
    // },
    // startDate: { type: Date, default: Date.now },
    // endDate: { type: Date, required: true },
    assignedBy: {
        type: mongoose_1.Types.ObjectId,
        ref: "Account", // admin or system user
        required: false,
    },
    status: {
        type: String,
        enum: ["active", "removed"],
        default: "active",
    },
    assignedAt: {
        type: Date,
        default: Date.now,
    },
    removedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });
ConsultantClientAssignmentSchema.index({ consultant: 1, client: 1 }, {
    unique: true,
    partialFilterExpression: { status: "active" }
});
exports.default = (0, mongoose_1.model)("ConsultantClientAssignment", ConsultantClientAssignmentSchema);
