// models/ConsultantProfile.ts
import { Schema, model, Types } from "mongoose";
//import { required } from "zod/v4/core/util.cjs";

export type updateConsultantProfile = {
    account: Types.ObjectId;
    professionalImage: string;
    about: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    gender: string;
    homeAddress: string;
    cityOfResidence: string;
    stateOfResidence: string;
    countryOfResidence: string;
    phoneCountryCode: string;
    workPhoneCountryCode: string;
    stateOfOrigin: string;
    countryOfOrigin: string;
    skills: [string];
    certification: string;
    languages: string[];
    assignedConsultants: string[];
    workType: [string];
    school: string;
    courseStudied: string;
    certificates: {
        name: string;
        issuingOrganization: string;
        issueStartDate: string;
        issueEndDate: string;
    }[];
    monthYear: string;
    identification: string;
    company: string;
    kycStatus: "pending" | "completed";
    position: string;
    startDate: string;
    endDate: string;
    responsibilities: string[];
    education: {
        school: string;
        courseStudied: string;
        certification: string;
        startDate: string;
        endDate: string;
    }[];
    Bio: string;
    cvUrl: string;
    linkedin: string;
    x: string;
    instagram: string;
    youtube: string;
    facebook: string;
    other: string;
    experience: string[];
}

const ConsultantProfileSchema = new Schema(
    {
        account: { type: Types.ObjectId, ref: "Account", required: true },

        // --------------------
        // BIO
        // --------------------
        professionalImage: { type: String, default: null }, // URL
        about: { type: String }, // Bio text

        // --------------------
        // PERSONAL INFO
        // --------------------
        firstName: { type: String },
        lastName: { type: String },
        email: { type: String },
        phoneNumber: { type: String },
        gender: { type: String },
        phoneCountryCode: { type: String, required: true },
        workPhoneCountryCode: { type: String, default: null },
        homeAddress: { type: String, default: null },
        identification: { type: String, default: null },
        cityOfResidence: { type: String, default: null },
        stateOfResidence: { type: String, default: null },
        countryOfResidence: { type: String, default: null },
        stateOfOrigin: { type: String, default: null },
        countryOfOrigin: { type: String, default: null },
        Bio: { type: String, default: "" },
        role: { type: String, default: "consultant" },
        status: { type: String, enum: ["active", "suspended", "shadowBanned", "pending"], default: "pending" },
        kycStatus: { type: String, enum: ["pending", "completed"], default: "pending" },

        // --------------------
        // SKILL & EXPERTISE
        // --------------------
        skills: { type: [String], default: null },       // multiple skills
        languages: [{ type: String }],    // multiple languages
        workType: {
            type: [String],
            enum: ["Physical", "Remote", "Hybrid", "remote", "physical", "hybrid", "onsite"],
        },

        // // --------------------
        // // EDUCATION
        // // --------------------

        // school: { type: String, default: null },
        // courseStudied: { type: String, default: null },
        // certification: { type: String, default: null },
        // monthYear: { type: String },
        // "March 2021"

        // --------------------
        // WORK EXPERIENCE
        // --------------------
        company: { type: String, default: null },
        position: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        responsibilities: [{ type: String }],
        experience: {
            type: String,
            enum: ["Intern", "Junior", "Intermediate", "Senior", "Executive"],
        },
        //education: [{ type: String }],
        education: [
            {
                school: { type: String, default: null },
                courseStudied: { type: String, default: null },
                certification: { type: String, default: null },
                startDate: { type: Date },  // Date object
                endDate: { type: Date },    // Date object
            }
        ],
        certificates: [
            {
                name: { type: String, default: null },
                issuingOrganization: { type: String, default: null },
                issueStartDate: { type: Date },
                issueEndDate: { type: Date },
            }],
        remark: { type: String, default: null },

        // --------------------
        // DOCUMENT UPLOADS
        // --------------------
        cvUrl: { type: String, default: null }, // uploaded CV file URL
        //identification: { type: String, default: null },

        // --------------------
        // SOCIAL PROFILES
        // --------------------
        linkedin: { type: String, default: null },
        x: { type: String, default: null },
        instagram: { type: String, default: null },
        youtube: { type: String, default: null },
        facebook: { type: String, default: null },
        other: { type: String, default: null },
    },
    { timestamps: true }
);
ConsultantProfileSchema.index({ account: 1 }, { unique: true });
ConsultantProfileSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        delete ret._id;
    },
})
export default model("ConsultantProfile", ConsultantProfileSchema);
