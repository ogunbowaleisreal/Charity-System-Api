import { Schema, model, Document, Types } from "mongoose";

export interface IFavorite extends Document {
    user: Types.ObjectId;
    campaign: Types.ObjectId;
    createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: true,
        },
        campaign: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// one favorite per user per campaign + makes toggling idempotent
FavoriteSchema.index({ user: 1, campaign: 1 }, { unique: true });

// fast "who favorited this campaign" lookups
FavoriteSchema.index({ campaign: 1 });

export default model<IFavorite>("Favorite", FavoriteSchema);