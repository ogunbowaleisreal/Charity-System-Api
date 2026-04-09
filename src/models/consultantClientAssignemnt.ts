import { Schema, model, Types } from "mongoose";
//import { required } from "zod/v4/core/util.cjs";

const ConsultantClientAssignmentSchema = new Schema(
    {
        consultant: {
            type: Types.ObjectId,
            ref: "Account",   // consultant account
            required: true,
        },
        client: {
            type: Types.ObjectId,
            ref: "Account",   // client account
            required: true,
        },
        bidId: {
            type: Types.ObjectId,
            ref: "Bids",
            //required: true
        },
        consultantProfile: {
            type: Types.ObjectId,
            ref: "ConsultantProfile",
            required: true,
        },
        clientProfile: {
            type: Types.ObjectId,
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
            type: Types.ObjectId,
            ref: "Account",   // admin or system user
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
    },
    { timestamps: true }
);

ConsultantClientAssignmentSchema.index(
    { consultant: 1, client: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "active" }
    }
);

export default model("ConsultantClientAssignment", ConsultantClientAssignmentSchema);
