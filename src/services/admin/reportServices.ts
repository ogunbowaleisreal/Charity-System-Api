import { MonthlyReport } from "../../models/Reports";


export type complainFilter = {
    complainAbout: string,
    complainFrom: string,
    year: number,
    month: number,
    page: number,
    limit: number
}


export type reportFilter = {
    accountId: string,
    client: string,
    //consultant: string,
    //request: string
    page: string,
    limit: number,
    year: number,
    type: "complain" | "report"
    month: number
}
export class AdminReportServices {
    async getReports(query: reportFilter) {
        const {
            accountId,
            client,
            year,
            month,
            page = 1,
            limit = 10
        } = query;

        const filter: any = {};

        if (client) filter.client = client;
        if (year) filter.year = Number(year);
        if (month) filter.month = Number(month);
        if (accountId) filter.consultant = accountId

        const skip = (Number(page) - 1) * Number(limit);

        const [reports, total] = await Promise.all([
            MonthlyReport.find({ type: "report", ...filter })
                .populate("consultant", "firstName lastName email companyName phone")
                .populate("client", "firstName lastName email phone")
                .sort({ year: -1, month: -1 })
                .skip(skip)
                .limit(Number(limit)),

            MonthlyReport.countDocuments({ type: "report", ...filter })
        ]);

        return {
            data: reports,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getComplains(query: complainFilter) {
        const {
            complainAbout,
            complainFrom,
            year,
            month,
            page = 1,
            limit = 10
        } = query;

        const filter: any = {};

        if (complainAbout) filter.complainAbout = complainAbout;
        if (complainFrom) filter.complainFrom = complainFrom;
        if (year) filter.year = Number(year);
        if (month) filter.month = Number(month);

        const skip = (Number(page) - 1) * Number(limit);

        const [reports, total] = await Promise.all([
            MonthlyReport.find({ type: "complain", ...filter })
                .populate("complainAbout", "firstName lastName email phone role")
                .populate("complainFrom", "firstName lastName email phone role")
                .sort({ year: -1, month: -1 })
                .skip(skip)
                .limit(Number(limit)),

            MonthlyReport.countDocuments({ type: "complain", ...filter })
        ]);

        return {
            data: reports,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}

