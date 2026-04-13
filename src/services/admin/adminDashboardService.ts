// import { Account } from "../../models/Accounts";
// import Request from "../../models/Requests";

// export class AdminDashboardService {

//     async getStats() {
//         const [
//             activeClients,
//             activeConsultants,
//             ongoingRequests
//         ] = await Promise.all([
//             Account.countDocuments({
//                 role: "client",
//                 status: "active"
//             }),
//             Account.countDocuments({
//                 role: "consultant",
//                 status: "active"
//             }),
//             Request.countDocuments({
//                 status: "ongoing"
//             })
//         ]);

//         return {
//             activeClients,
//             activeConsultants,
//             ongoingRequests
//         };
//     }
// }
