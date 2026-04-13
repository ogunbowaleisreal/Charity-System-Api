// import { Response, NextFunction } from "express";
// import { AdminAuthenticatedRequest } from "../../types/admin.management";
// import { AdminDashboardService } from "../../services/admin/adminDashboardService";
// import { sendSuccessResponse } from "../../utils/helpers";
// import logger from "../../logger";

// const dashboardService = new AdminDashboardService();

// export class AdminDashboardController {

//     async getDashboardStats(
//         req: AdminAuthenticatedRequest,
//         res: Response,
//         next: NextFunction
//     ) {
//         try {
//             const stats = await dashboardService.getStats();
//             return sendSuccessResponse(
//                 res,
//                 stats,
//                 "Dashboard stats retrieved successfully",
//                 200
//             );
//         } catch (err: any) {
//             logger.error(err.message);
//             next(err);
//         }
//     }
// }
