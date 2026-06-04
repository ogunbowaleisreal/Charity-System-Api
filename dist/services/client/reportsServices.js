"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientReportServices = void 0;
const Reports_1 = require("../../models/Reports");
const mongoose_1 = require("mongoose");
const Accounts_1 = require("../../models/Accounts");
class ClientReportServices {
    async uploadReport(userId, accountId, payload) {
        const { year, month, documentUrl, documentFileId, fileName, type, 
        // requestId,
        complain, metadata } = payload;
        // let actualtype = type
        let uploadData = {};
        if (type === "report") {
            if (!documentUrl || !documentFileId || !fileName) {
                throw new Error("document url, file id and file name are required for reports");
            }
        }
        if (type === "complain") {
            if (!complain) {
                throw new Error("complain text is required");
            }
        }
        // if (!documentUrl || !documentFileId) {
        //     throw new Error("document url and file id are required");
        // }
        const account = await Accounts_1.Account.findById(userId);
        if (!account)
            throw new Error("user account not found");
        const role = account.role;
        const reportedAccount = await Accounts_1.Account.findById(accountId);
        if (!reportedAccount)
            throw new Error("reported account not found");
        const reportedRole = reportedAccount.role;
        if (role == "client" && type == "report")
            throw new Error("clients are not allowed to create reports");
        if (role == reportedRole)
            throw new Error("account with same role cannot report each other");
        if (type == "report") {
            uploadData = {
                consultant: new mongoose_1.Types.ObjectId(userId),
                client: new mongoose_1.Types.ObjectId(accountId),
                year,
                fileName,
                month,
                type,
                //complain,
                //request: requestId,
                documentUrl,
                documentFileId,
                uploadedAt: new Date(),
                // status: "replaced",
                metadata,
            };
        }
        if (type == "complain") {
            uploadData = {
                //consultant: new Types.ObjectId(userId),
                //client: new Types.ObjectId(accountId),
                // year,
                //fileName,
                //month,
                complainFrom: new mongoose_1.Types.ObjectId(userId),
                type,
                complain,
                complainAbout: new mongoose_1.Types.ObjectId(accountId),
                //request: requestId,
                //documentUrl,
                //documentFileId,
                uploadedAt: new Date(),
                // status: "replaced",
                metadata,
            };
        }
        // if (role == "consultant") {
        //     type = "report"
        // }
        console.log(uploadData);
        // if (type === "report") {
        //     return MonthlyReport.findOneAndUpdate(
        //         {
        //             consultant: userId,
        //             client: accountId,
        //             year,
        //             month,
        //             type: "report",
        //         },
        //         { $set: uploadData },
        //         {
        //             new: true,
        //             upsert: true,
        //             runValidators: true,
        //         }
        //     );
        // }
        // complaints → always create new
        return Reports_1.MonthlyReport.create(uploadData);
        // return MonthlyReport.findOneAndUpdate(
        //     { consultant: userId, client: accountId, month, year },
        //     uploadData,
        //     { new: true, upsert: true }
        // );
    }
    // async getMyReports(accountId: string, filters: reportFilter, page: number = 1, limit: number = 10) {
    //     const user = await Account.findById(accountId);
    //     if (!user) throw new Error("user not found");
    //     const skip = (page - 1) * limit;
    //     if (user.role == "client") {
    //         const reports = await MonthlyReport.find({ client: accountId, ...filters }).sort({ year: -1, month: -1 }).skip(skip).limit(limit).populate('consultant');
    //         const total = await MonthlyReport.countDocuments({ client: accountId });
    //         const totalPages = Math.ceil(total / limit);
    //         return { data: reports, pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
    //     }
    //     const reports = await MonthlyReport.find({ consultant: accountId }).sort({ year: -1, month: -1 }).skip(skip).limit(limit).populate('client');
    //     const total = await MonthlyReport.countDocuments({ consultant: accountId });
    //     const totalPages = Math.ceil(total / limit);
    //     return { data: reports, pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
    // }
    async getMyReports(accountId, filters) {
        const user = await Accounts_1.Account.findById(accountId);
        if (!user)
            throw new Error("user not found");
        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 10;
        const skip = (page - 1) * limit;
        const query = {};
        if (user.role === "client") {
            // 🔒 hard constraint
            query.client = accountId;
            // ✅ optional narrowing
            if (filters.consultant) {
                query.consultant = filters.consultant;
            }
            query.type = "report";
        }
        if (user.role === "consultant") {
            // 🔒 hard constraint
            query.consultant = accountId;
            // ✅ optional narrowing
            if (filters.client) {
                query.client = filters.client;
            }
            query.type = "report";
        }
        // shared optional filters
        //if (filters.request) query.request = filters.request;
        if (filters.year)
            query.year = filters.year;
        if (filters.month)
            query.month = filters.month;
        //   if (filters.type) query.type = filters.type
        const populateField = user.role === "client" ? "consultant" : "client";
        const [reports, total] = await Promise.all([
            Reports_1.MonthlyReport.find(query)
                .sort({ year: -1, month: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                path: populateField,
                populate: {
                    path: "businessCategory"
                }
            }), Reports_1.MonthlyReport.countDocuments(query)
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: reports,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1
            }
        };
    }
}
exports.ClientReportServices = ClientReportServices;
