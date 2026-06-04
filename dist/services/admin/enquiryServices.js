"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminEnquiryServices = void 0;
const clientEnquiries_1 = require("../../models/clientEnquiries");
class AdminEnquiryServices {
    async getAllEnquiries(query) {
        const filter = {};
        if (query.email) {
            filter.email = query.email;
        }
        return clientEnquiries_1.Enquiry.find(filter).sort({ createdAt: -1 });
    }
    async getEnquiryById(enquiryId) {
        return clientEnquiries_1.Enquiry.findById(enquiryId);
    }
    async deleteEnquiry(enquiryId) {
        return clientEnquiries_1.Enquiry.findByIdAndDelete(enquiryId);
    }
}
exports.AdminEnquiryServices = AdminEnquiryServices;
