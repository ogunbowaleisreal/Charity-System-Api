import { Schema, model, Document } from "mongoose";

export interface IPlan extends Document {
    name: string;
    description?: string;
    amount: number; // in kobo
    interval: "monthly" | "annually" | "hourly" | "daily";
    currency: string;
    // description?: string;
    paystackPlanCode: string;
    features: [string],
    status: "active" | "inactive";
    type: string;
    amountInKobo: number;
    createdAt: Date;
}

const PlanSchema = new Schema<IPlan>({
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

export default model<IPlan>("Plan", PlanSchema);