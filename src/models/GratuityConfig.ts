import { Schema, model, Document } from "mongoose";

export interface IGratuityConfig extends Document {
    isEnabled: boolean;

    title: string;         // e.g. "Support African Children"
    description?: string;  // optional UI description

    // optional UI hints
    suggestedPercentages: number[];

    updatedAt: Date;
}

const GratuityConfigSchema = new Schema<IGratuityConfig>(
    {
        isEnabled: {
            type: Boolean,
            default: false,
        },

        title: {
            type: String,
            required: true,
        },

        description: {
            type: String,
        },

        suggestedPercentages: {
            type: [Number],
            default: [5, 10, 15],
        },
    },
    { timestamps: true }
);

export default model<IGratuityConfig>("GratuityConfig", GratuityConfigSchema);