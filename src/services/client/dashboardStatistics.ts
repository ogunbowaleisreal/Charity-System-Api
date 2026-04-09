import consultantClientAssignemnt from "../../models/consultantClientAssignemnt";
import { Account } from "../../models/Accounts";
import clientProfile from "../../models/clientProfile";
import ConsultantProfile from "../../models/ConsultantProfile";
import { MonthlyReport } from "../../models/Reports";
import { PipelineStage, Types } from "mongoose";
import Bids from "../../models/Bids";

// 🔴 CHANGE #1: helper import updated
import { getCurrentAndLastMonth, calculateTrend } from "../../utils/helpers";

export class DashboardService {

    // ================= CLIENT =================
    static async clientDashboard(clientId: Types.ObjectId) {
        const { current, previous } = getCurrentAndLastMonth();

        const consultantsAgg = await consultantClientAssignemnt.aggregate([
            {
                $match: {
                    client: clientId,
                    status: "active",
                },
            },
            {
                $facet: {
                    current: [
                        {
                            $match: {
                                createdAt: {
                                    $gte: current.start,
                                    $lt: current.end,
                                },
                            },
                        },
                        { $count: "count" },
                    ],
                    previous: [
                        {
                            $match: {
                                createdAt: {
                                    $gte: previous.start,
                                    $lt: previous.end,
                                },
                            },
                        },
                        { $count: "count" },
                    ],
                },
            },
        ]);

        const currentConsultants = consultantsAgg[0]?.current[0]?.count ?? 0;
        const previousConsultants = consultantsAgg[0]?.previous[0]?.count ?? 0;

        const reportsAgg = await MonthlyReport.aggregate([
            {
                $match: {
                    client: clientId,
                    type: "report",
                },
            },
            {
                $facet: {
                    current: [
                        {
                            $match: {
                                uploadedAt: {
                                    $gte: current.start,
                                    $lt: current.end,
                                },
                            },
                        },
                        { $count: "count" },
                    ],
                    previous: [
                        {
                            $match: {
                                uploadedAt: {
                                    $gte: previous.start,
                                    $lt: previous.end,
                                },
                            },
                        },
                        { $count: "count" },
                    ],
                },
            },
        ]);

        const currentReports = reportsAgg[0]?.current[0]?.count ?? 0;
        const previousReports = reportsAgg[0]?.previous[0]?.count ?? 0;

        return {
            activeConsultantsChange: {
                count: currentConsultants,
                ...calculateTrend(currentConsultants, previousConsultants),
            },
            reportsChange: {
                count: currentReports,
                ...calculateTrend(currentReports, previousReports),
            },
        };

    }

    // ================= CONSULTANT =================
    static async consultantDashboard(consultantId: Types.ObjectId) {
        const { current, previous } = getCurrentAndLastMonth();

        const clientsAgg = await consultantClientAssignemnt.aggregate([
            {
                $match: {
                    consultant: consultantId,
                    status: "active",
                },
            },
            {
                $facet: {
                    current: [
                        {
                            $match: {
                                createdAt: {
                                    $gte: current.start,
                                    $lt: current.end,
                                },
                            },
                        },
                        { $count: "count" },
                    ],
                    previous: [
                        {
                            $match: {
                                createdAt: {
                                    $gte: previous.start,
                                    $lt: previous.end,
                                },
                            },
                        },
                        { $count: "count" },
                    ],
                },
            },
        ]);

        const currentClients = clientsAgg[0]?.current[0]?.count ?? 0;
        const previousClients = clientsAgg[0]?.previous[0]?.count ?? 0;

        const reportsAgg = await MonthlyReport.aggregate([
            {
                $match: {
                    consultant: consultantId,
                    type: "report",
                },
            },
            {
                $facet: {
                    current: [
                        {
                            $match: {
                                uploadedAt: {
                                    $gte: current.start,
                                    $lt: current.end,
                                },
                            },
                        },
                        { $count: "count" },
                    ],
                    previous: [
                        {
                            $match: {
                                uploadedAt: {
                                    $gte: previous.start,
                                    $lt: previous.end,
                                },
                            },
                        },
                        { $count: "count" },
                    ],
                },
            },
        ]);

        const currentReports = reportsAgg[0]?.current[0]?.count ?? 0;
        const previousReports = reportsAgg[0]?.previous[0]?.count ?? 0;

        const pendingBids = await Bids.countDocuments({
            consultantId,
            status: "pending",
        });

        return {
            activeClientsChange: {
                count: currentClients,
                ...calculateTrend(currentClients, previousClients),
            },
            reportsChange: {
                count: currentReports,
                ...calculateTrend(currentReports, previousReports),
            },
            pendingBids,
        };

    }
}

// import consultantClientAssignemnt from "../../models/consultantClientAssignemnt";
// import { Account } from "../../models/Accounts";
// import clientProfile from "../../models/clientProfile";
// import ConsultantProfile from "../../models/ConsultantProfile";
// import { MonthlyReport } from "../../models/Reports";
// import { PipelineStage, Types } from "mongoose";
// import Bids from "../../models/Bids";
// import { getCurrentAndLastMonth, calculatePercentageChange } from "../../utils/helpers";

// export class DashboardService {

//     // ================= CLIENT =================
//     static async clientDashboard(clientId: Types.ObjectId) {
//         const { current, previous } = getCurrentAndLastMonth();

//         // ACTIVE CONSULTANTS (AGGREGATION)
//         const consultantsAgg = await consultantClientAssignemnt.aggregate([
//             {
//                 $match: {
//                     client: clientId,
//                     status: "active",
//                 },
//             },
//             {
//                 $facet: {
//                     current: [
//                         {
//                             $match: {
//                                 createdAt: {
//                                     $gte: current.start,
//                                     $lt: current.end,
//                                 },
//                             },
//                         },
//                         { $count: "count" },
//                     ],
//                     previous: [
//                         {
//                             $match: {
//                                 createdAt: {
//                                     $gte: previous.start,
//                                     $lt: previous.end,
//                                 },
//                             },
//                         },
//                         { $count: "count" },
//                     ],
//                 },
//             },
//         ]);

//         const currentConsultants = consultantsAgg[0]?.current[0]?.count ?? 0;
//         const previousConsultants = consultantsAgg[0]?.previous[0]?.count ?? 0;

//         // REPORTS RECEIVED
//         const reportsAgg = await MonthlyReport.aggregate([
//             {
//                 $match: {
//                     client: clientId,
//                     type: "report",
//                 },
//             },
//             {
//                 $facet: {
//                     current: [
//                         {
//                             $match: {
//                                 uploadedAt: {
//                                     $gte: current.start,
//                                     $lt: current.end,
//                                 },
//                             },
//                         },
//                         { $count: "count" },
//                     ],
//                     previous: [
//                         {
//                             $match: {
//                                 uploadedAt: {
//                                     $gte: previous.start,
//                                     $lt: previous.end,
//                                 },
//                             },
//                         },
//                         { $count: "count" },
//                     ],
//                 },
//             },
//         ]);

//         const currentReports = reportsAgg[0]?.current[0]?.count ?? 0;
//         const previousReports = reportsAgg[0]?.previous[0]?.count ?? 0;

//         return {
//             totalActiveConsultants: currentConsultants,
//             activeConsultantsChangePercent: calculatePercentageChange(
//                 currentConsultants,
//                 previousConsultants
//             ),
//             totalReports: currentReports,
//             reportsChangePercent: calculatePercentageChange(
//                 currentReports,
//                 previousReports
//             ),
//         };
//     }

//     // ================= CONSULTANT =================
//     static async consultantDashboard(consultantId: Types.ObjectId) {
//         const { current, previous } = getCurrentAndLastMonth();

//         // ACTIVE CLIENTS
//         const clientsAgg = await consultantClientAssignemnt.aggregate([
//             {
//                 $match: {
//                     consultant: consultantId,
//                     status: "active",
//                 },
//             },
//             {
//                 $facet: {
//                     current: [
//                         {
//                             $match: {
//                                 createdAt: {
//                                     $gte: current.start,
//                                     $lt: current.end,
//                                 },
//                             },
//                         },
//                         { $count: "count" },
//                     ],
//                     previous: [
//                         {
//                             $match: {
//                                 createdAt: {
//                                     $gte: previous.start,
//                                     $lt: previous.end,
//                                 },
//                             },
//                         },
//                         { $count: "count" },
//                     ],
//                 },
//             },
//         ]);

//         const currentClients = clientsAgg[0]?.current[0]?.count ?? 0;
//         const previousClients = clientsAgg[0]?.previous[0]?.count ?? 0;

//         // REPORTS SUBMITTED
//         const reportsAgg = await MonthlyReport.aggregate([
//             {
//                 $match: {
//                     consultant: consultantId,
//                     type: "report",
//                 },
//             },
//             {
//                 $facet: {
//                     current: [
//                         {
//                             $match: {
//                                 uploadedAt: {
//                                     $gte: current.start,
//                                     $lt: current.end,
//                                 },
//                             },
//                         },
//                         { $count: "count" },
//                     ],
//                     previous: [
//                         {
//                             $match: {
//                                 uploadedAt: {
//                                     $gte: previous.start,
//                                     $lt: previous.end,
//                                 },
//                             },
//                         },
//                         { $count: "count" },
//                     ],
//                 },
//             },
//         ]);

//         const currentReports = reportsAgg[0]?.current[0]?.count ?? 0;
//         const previousReports = reportsAgg[0]?.previous[0]?.count ?? 0;

//         // PENDING BIDS (simple count is fine here)
//         const pendingBids = await Bids.countDocuments({
//             consultantId,
//             status: "pending",
//         });

//         return {
//             totalActiveClients: currentClients,
//             activeClientsChangePercent: calculatePercentageChange(
//                 currentClients,
//                 previousClients
//             ),
//             totalReportsSubmitted: currentReports,
//             reportsChangePercent: calculatePercentageChange(
//                 currentReports,
//                 previousReports
//             ),
//             pendingBids,
//         };
//     }
// }