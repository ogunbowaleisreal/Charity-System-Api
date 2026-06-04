"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnquiryServices = void 0;
const clientEnquiries_1 = require("../../models/clientEnquiries");
const Email_services_1 = __importDefault(require("../Email.services"));
const Contact_1 = require("../../models/Contact");
const emailService = new Email_services_1.default();
class EnquiryServices {
    async createEnquiry(payload) {
        const enquiry = await clientEnquiries_1.Enquiry.create(payload);
        if (!enquiry)
            throw new Error("failed to create enquiry");
        const contact = await Contact_1.Contact.findOne({});
        if (!contact)
            throw new Error("contact details not found ");
        await emailService.sendNewEnquiryEmail(enquiry, contact.emailAddress);
        return enquiry;
    }
    async getAllEnquiries(query) {
        const filter = {};
        // Optional filters (easy to expand later)
        if (query.email) {
            filter.email = query.email;
        }
        return await clientEnquiries_1.Enquiry.find(filter)
            .sort({ createdAt: -1 });
    }
    async getEnquiryById(enquiryId) {
        return await clientEnquiries_1.Enquiry.findById(enquiryId);
    }
    async deleteEnquiry(enquiryId) {
        return await clientEnquiries_1.Enquiry.findByIdAndDelete(enquiryId);
    }
}
exports.EnquiryServices = EnquiryServices;
