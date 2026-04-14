import mongoose, { Schema, model, Document } from 'mongoose';
//import { BusinessCategory } from './campaignCategory';


export interface UpdateClientProfile extends Document {
    account: Schema.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    companyName: string;
    companySize: number;
    industry: string;
    address: string;
    contactPerson: string;
    contactPhone: string;
    workEmail?: string;
    workPhone?: string;
    role: "client";
    workType?: string,
    positionInCompany?: string,
    workPhoneCountryCode?: string,
    businessCategory?: string,
    businessAddress?: string,
    operatingCity?: string,
    operatingCountry?: string,
    operatingState?: string,
    about?: string,
    subscription: string,
    employeeCapacity?: string,
    coreNeeds?: string,
    registrationNumber: string,
    phoneCountryCode: string,
    facebook: string,
    kycStatus: "pending" | "completed"
    profilePicture: string,
    x: string,
    other: string,
    website: string,
    linkedin: string,
    instagram: string,
    youtube: string,
}



const ClientProfileSchema = new Schema<UpdateClientProfile>(
    {
        account: { type: mongoose.Types.ObjectId, ref: "Account", required: true, index: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phoneCountryCode: { type: String, required: true },
        email: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        companyName: { type: String, required: true },
        companySize: { type: Number, default: null },
        industry: { type: String, default: null },
        address: { type: String, default: null },
        contactPerson: { type: String, default: null },
        role: { type: String, default: "client" },
        businessCategory: {
            type: String,
            // validate: {
            //     validator: async function (value: string) {
            //         // Only validate if role is client
            //         // if (this.role !== "client") return true;

            //         // Check if the category exists in the DB
            //         const category = await BusinessCategory.findById(value);
            //         return !!category; // true if found, false otherwise
            //     },
            //     message: (props: any) => `Business category '${props.value}' does not exist.`
            // }
        },
        profilePicture: { type: String, default: null },
        //contactPhone: { type: String },

        // --------------------
        // BUSINESS INFORMATION
        // --------------------
        workEmail: { type: String, default: null },
        workPhone: { type: String, default: null },
        workPhoneCountryCode: { type: String, default: null },
        positionInCompany: { type: String, default: null },
        businessAddress: { type: String, default: null },
        operatingCity: { type: String, defaul: null },
        operatingState: { type: String, default: null },
        operatingCountry: { type: String, default: null },
        kycStatus: { type: String, enum: ["pending", "completed"], default: "pending" },
        // subscription: [{ : {}, default: null }],

        // --------------------
        // BASIC DETAILS
        // --------------------
        about: { type: String, default: null },
        employeeCapacity: { type: String, default: null },
        coreNeeds: { type: String, default: null },
        registrationNumber: { type: String, default: null },

        // --------------------
        // SOCIAL LINKS
        // --------------------
        website: { type: String, default: null },
        facebook: { type: String, default: null },
        linkedin: { type: String, default: null },
        x: { type: String, default: null },
        instagram: { type: String, default: null },
        youtube: { type: String, default: null },
        other: { type: String, default: null },
    },
    { timestamps: true }
);

export default model("ClientProfile", ClientProfileSchema);

// const ClientProfileSchema = new Schema({
//     accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
//     companyName: { type: String, required: true },
//     industry: { type: String },
//     companySize: { type: Number },
//     address: { type: String },
//     contactPerson: { type: String },
//     contactPhone: { type: String },
//     subscriptionPlan: {
//         type: String,
//         enum: ["essential", "growth", "premium", null],
//         default: null
//     },
//     // optionally
//     //subscriptionPlan: { type: String, enum: ["basic", "pro", "enterprise"] },
//     subscriptionStatus: { type: String, enum: ["none", "active", "expired"], default: "none" }
// }, { timestamps: true });
