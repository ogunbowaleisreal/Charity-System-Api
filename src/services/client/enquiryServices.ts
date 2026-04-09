import { Enquiry } from "../../models/clientEnquiries";
import { FilterQuery } from "mongoose";
import { EnquiryDocument } from "../../models/clientEnquiries";
import EmailService from "../Email.services";
import { Contact } from "../../models/Contact";

const emailService = new EmailService()

export class EnquiryServices {
    async createEnquiry(payload: Partial<EnquiryDocument>) {
        const enquiry = await Enquiry.create(payload)
        if (!enquiry) throw new Error("failed to create enquiry")
        const contact = await Contact.findOne({})
        if (!contact) throw new Error("contact details not found ")
        await emailService.sendNewEnquiryEmail(enquiry, contact.emailAddress)
        return enquiry;
    }

    async getAllEnquiries(query: any) {
        const filter: FilterQuery<EnquiryDocument> = {};

        // Optional filters (easy to expand later)
        if (query.email) {
            filter.email = query.email;
        }

        return await Enquiry.find(filter)
            .sort({ createdAt: -1 });
    }

    async getEnquiryById(enquiryId: string) {
        return await Enquiry.findById(enquiryId);
    }

    async deleteEnquiry(enquiryId: string) {
        return await Enquiry.findByIdAndDelete(enquiryId);
    }
}
