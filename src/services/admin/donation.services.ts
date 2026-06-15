import { Donation } from "../../models/Donations";
import { Types } from "mongoose";



export type donationFilter = {
    page: number,
    limit: number
}

export class DonationService {
    async getDonationById(donationId: string) {
        const donation = await Donation.findById(donationId)
            .populate("campaign")
            .populate("donor");

        if (!donation) throw new Error("Donation not found");

        return donation;
    }


    async getUserDonations(userId: string, query: donationFilter) {
        const { page, limit } = query
        const donations = await Donation.find({ donor: userId })
            .populate("donor", "firstName lastName profilePicture logo country state")
            .populate("campaign", "title image description")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
        const total = await Donation.countDocuments({ donor: userId });
        const totalPages = Math.ceil(total / limit);
        return {
            donations, pagination: {
                current_page: page,
                total_pages: totalPages,
                per_page: limit,
                total_records: total,
                has_next_page: page < totalPages,
                has_prev_page: page > 1
            }
        };
    }
}