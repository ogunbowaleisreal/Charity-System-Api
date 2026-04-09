import { Schema, model, Document } from 'mongoose';
//import { required } from 'zod/v4/core/util.cjs';
export interface IBids extends Document {
    clientId: string;
    consultantId: string;
    requestId: string;
    amount: number;
    status: string;
    reason: string;
    workType: [string];
    createdAt: Date;
    updatedAt: Date;

}

const BidsSchema = new Schema({
    //clientId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    consultantId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    requestId: { type: Schema.Types.ObjectId, ref: "Request", required: true },
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

export default model("Bids", BidsSchema);