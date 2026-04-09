import { Schema, model, Document } from "mongoose";
export interface IPlanDiscount {
    planId: Schema.Types.ObjectId;
    percentage: number; // e.g. 20
    active: boolean;
    startsAt?: Date;
    endsAt?: Date;
    createdAt: Date;
}

const PlanDiscountSchema = new Schema<IPlanDiscount>({
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    percentage: { type: Number, min: 1, max: 100, required: true },
    active: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date,
}, { timestamps: true });

export default model<IPlanDiscount>("PlanDiscount", PlanDiscountSchema);
