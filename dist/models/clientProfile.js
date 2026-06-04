"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ClientProfileSchema = new mongoose_1.Schema({
    account: { type: mongoose_1.default.Types.ObjectId, ref: "Account", required: true, index: true },
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
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("ClientProfile", ClientProfileSchema);
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
