import mongoose, { Schema, Document } from "mongoose";

export interface ISubscriber extends Document {
    email: string;
    isSubscribed: boolean;
    subscribedAt: Date;
    unsubscribedAt?: Date;
}

const subscriberSchema = new Schema<ISubscriber>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        isSubscribed: {
            type: Boolean,
            default: true,
        },

        subscribedAt: {
            type: Date,
            default: Date.now,
        },

        unsubscribedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ISubscriber>(
    "Subscriber",
    subscriberSchema
);