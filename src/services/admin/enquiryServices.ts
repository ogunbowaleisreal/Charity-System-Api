import { Enquiry, EnquiryDocument } from "../../models/clientEnquiries";
import { FilterQuery } from "mongoose";

export class AdminEnquiryServices {

    async getAllEnquiries(query: any) {
        const filter: FilterQuery<EnquiryDocument> = {};

        if (query.email) {
            filter.email = query.email;
        }

        return Enquiry.find(filter).sort({ createdAt: -1 });
    }

    async getEnquiryById(enquiryId: string) {
        return Enquiry.findById(enquiryId);
    }

    async deleteEnquiry(enquiryId: string) {
        return Enquiry.findByIdAndDelete(enquiryId);
    }
}
