"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enquiry = void 0;
const mongoose_1 = require("mongoose");
const enquirySchema = new mongoose_1.Schema({
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
}, { timestamps: true });
exports.Enquiry = (0, mongoose_1.model)("Enquiry", enquirySchema);
