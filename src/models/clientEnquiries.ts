import { Schema, model, Document } from "mongoose";

export type ContactMethod = "whatsapp" | "email" | "phone";

export interface EnquiryDocument extends Document {
    fullName: string;
    companyName?: string;
    email: string;
    phoneNumber?: string;
    numberOfEmployees: string;
    preferredContactMethod: ContactMethod;
    hrChallenges?: string;
    createdAt: Date;
}

const enquirySchema = new Schema<EnquiryDocument>(
    {
        fullName: { type: String, required: true, trim: true },
        companyName: { type: String, trim: true },
        email: { type: String, required: true, lowercase: true },
        phoneNumber: { type: String },
        numberOfEmployees: {
            type: String,
            required: true,
            enum: ["1-10", "11-50", "51-200", "200+"],
        },
        preferredContactMethod: {
            type: String,
            enum: ["whatsapp", "email", "phone"],
            required: true,
        },
        hrChallenges: { type: String },
    },
    { timestamps: true }
);

export const Enquiry = model<EnquiryDocument>("Enquiry", enquirySchema);
