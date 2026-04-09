import mongoose, { Document, Schema } from "mongoose";

export interface IContact extends Document {
    phoneNumber: string;
    whatsappNumber: string;
    emailAddress: string;
}

const ContactSchema = new Schema<IContact>({
    phoneNumber: {
        type: String,
    },
    whatsappNumber: {
        type: String,
    },
    emailAddress: {
        type: String,
    },
});

export const Contact = mongoose.model<IContact>("contact", ContactSchema);


