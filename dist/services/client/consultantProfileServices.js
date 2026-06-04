"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultantProfileServices = void 0;
//import { updateClientProfile } from "../../types/clientprofile";
const ConsultantProfile_1 = __importDefault(require("../../models/ConsultantProfile"));
const Accounts_1 = require("../../models/Accounts");
class ConsultantProfileServices {
    async getConsultantProfile(consultantId) {
        const profile = await ConsultantProfile_1.default.findOne({ account: consultantId });
        if (profile) {
            return { profile, subscription: null };
        }
        return null;
    }
    async deleteEducation(id, educationId) {
        const education = await ConsultantProfile_1.default.findOneAndUpdate({ account: id }, { $pull: { education: { _id: educationId } } }, { new: true });
        return education;
    }
    async deleteCertificate(id, certificateId) {
        const certificate = await ConsultantProfile_1.default.findOneAndUpdate({ account: id }, { $pull: { certificates: { _id: certificateId } } }, { new: true });
        return certificate;
    }
    async updateConsultantProfile(accountId, fields) {
        const allowedFields = [
            "professionalImage",
            "about",
            "firstName",
            "lastName",
            "phoneNumber",
            "gender",
            "homeAddress",
            "cityOfResidence",
            "stateOfResidence",
            "countryOfResidence",
            "stateOfOrigin",
            "countryOfOrigin",
            "phoneCountryCode",
            "workPhoneCountryCode",
            "Bio",
            "company",
            "position",
            "startDate",
            "endDate",
            "responsibilities",
            "school",
            "courseStudied",
            "certification",
            "certificates",
            "identification",
            "workType",
            "monthYear",
            "skills",
            "languages",
            "workType",
            "education",
            "facebook",
            "cvUrl",
            "linkedin",
            "x",
            "instagram",
            "youtube",
            "other",
        ];
        const updateData = {};
        for (const field of allowedFields) {
            if (fields[field] !== undefined) {
                updateData[field] = fields[field];
            }
        }
        const updatedData = await ConsultantProfile_1.default.findOneAndUpdate({ account: accountId }, { $set: updateData }, { new: true });
        console.log(updatedData);
        /* =======================
           KYC COMPLETION CHECK
           ======================= */
        if (updatedData) {
            const REQUIRED_KYC_FIELDS = [
                "firstName",
                "lastName",
                "phoneNumber",
                "gender",
                "homeAddress",
                "cityOfResidence",
                "stateOfResidence",
                "countryOfResidence",
                "countryOfOrigin",
                "professionalImage",
                "skills",
                "languages",
                "workType",
            ];
            const isKycComplete = REQUIRED_KYC_FIELDS.every((field) => {
                const value = updatedData[field];
                return value !== undefined && value !== null && value !== "";
            });
            if (isKycComplete && updatedData.kycStatus !== "completed") {
                await ConsultantProfile_1.default.updateOne({ _id: updatedData._id }, { $set: { kycStatus: "completed" } });
                await Accounts_1.Account.updateOne({ _id: accountId }, { $set: { kycStatus: "completed" } });
            }
            return updatedData;
        }
        throw new Error("update failed");
    }
}
exports.ConsultantProfileServices = ConsultantProfileServices;
// export class ConsultantProfileServices {
//     async getConsultantProfile(consultantId: string) {
//         const profile = await ConsultantProfile.findOne({ account: consultantId })
//         if (profile) {
//             return { profile, subscription: null }
//         }
//         return null
//     }
//     async updateConsultantProfile(accountId: mongoose.Types.ObjectId, fields: updateConsultantProfile) {
//         // const allowedFields: (keyof updateConsultantProfile)[] = [
//         //     "account",
//         //     "bio",
//         //     "professionalImage",
//         //     "about",
//         //     "personalInfo",
//         //     "firstName",
//         //     "lastName",
//         //     "phoneNumber",
//         //     "gender",
//         //     "homeAddress",
//         //     "cityOfResidence",
//         //     "stateOfResidence",
//         //     "countryOfResidence",
//         //     "stateOfOrigin",
//         //     "countryOfOrigin"
//         // ];
//         const allowedFields: (keyof updateConsultantProfile)[] = [
//             "professionalImage",
//             "about",
//             "firstName",
//             "lastName",
//             "phoneNumber",
//             "gender",
//             "homeAddress",
//             "cityOfResidence",
//             "stateOfResidence",
//             "countryOfResidence",
//             "stateOfOrigin",
//             "countryOfOrigin",
//             "phoneCountryCode",
//             "workPhoneCountryCode",
//             "Bio",
//             "company",
//             "position",
//             "startDate",
//             "endDate",
//             "responsibilities",
//             "school",
//             "courseStudied",
//             "certification",
//             "monthYear",
//             "skills",
//             "languages",
//             "workType",
//             "education",
//             "facebook",
//             // "twitter",
//             //"experience",
//             "cvUrl",
//             "linkedin",
//             "x",
//             "instagram",
//             "youtube",
//             "other",
//         ];
//         const updateData: Record<string, any> = {};
//         for (const field of allowedFields) {
//             if (fields[field] !== undefined) {
//                 updateData[field] = fields[field];
//             }
//         }
//         //console.log(updateData)
//         const updatedData = await ConsultantProfile.findOneAndUpdate(
//             { account: accountId },
//             { $set: updateData },
//             { new: true }
//         )
//         console.log(updatedData)
//         if (updatedData) {
//             return updatedData
//         }
//         throw new Error("update failed")
//     }
// }
