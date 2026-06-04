"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/ConsultantProfile.ts
const mongoose_1 = require("mongoose");
const ConsultantProfileSchema = new mongoose_1.Schema({
    account: { type: mongoose_1.Types.ObjectId, ref: "Account", required: true },
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
    skills: { type: [String], default: null }, // multiple skills
    languages: [{ type: String }], // multiple languages
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
            startDate: { type: Date }, // Date object
            endDate: { type: Date }, // Date object
        }
    ],
    certificates: [
        {
            name: { type: String, default: null },
            issuingOrganization: { type: String, default: null },
            issueStartDate: { type: Date },
            issueEndDate: { type: Date },
        }
    ],
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
}, { timestamps: true });
ConsultantProfileSchema.index({ account: 1 }, { unique: true });
ConsultantProfileSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    },
});
exports.default = (0, mongoose_1.model)("ConsultantProfile", ConsultantProfileSchema);
