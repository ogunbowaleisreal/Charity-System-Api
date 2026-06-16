import { Donation } from "../../models/Donations";
import { Types } from "mongoose";
import { DashboardService } from "./dashboardStatistics";
import { formatPagination } from "../../utils/admin/paginationUtills";



export type donationFilter = {
    page: number,
    limit: number
}

export class DonationService {
    dashboard = new DashboardService()
    async getDonationById(donationId: string) {
        const donation = await Donation.findById(donationId)
            .populate("campaign")
            .populate("donor");

        if (!donation) throw new Error("Donation not found");

        return donation;
    }


    async getUserDonations(userId: string, query: donationFilter) {
        const { page, limit } = query
        const donationStats = await this.dashboard.getUserDonationStats(new Types.ObjectId(userId));
        const donations = await Donation.find({ donor: userId })
            .populate("donor", "firstName lastName profilePicture logo country state")
            .populate("campaign", "title image description")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
        const total = await Donation.countDocuments({ donor: userId });
        //const totalPages = Math.ceil(total / limit);
        return formatPagination({ donations, donationStats }, total, page, limit)

    }
}