import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { jwtUtil } from "../utils/jwt";
import { AuthenticatedRequest } from "../types/auth";
import { sendErrorResponse } from "../utils/helpers";
import { HTTP_STATUS, ERROR_CODES } from "../utils/constants";
import { CacheService } from "../services/cacheServices";
import logger from "../logger";
import { Account } from "../models/Accounts";
//import { IUser } from "../models/Accounts";
// import { Listing } from "@/models/Listing";
//import { AuthenticatedRequest } from "./verifyClients";
import { JWTPayload } from "../types/auth";
export interface AuthenticatedClientRequest extends Request {
    user?: any;
}
// const authenticateJWT = (
//     req: AuthenticatedRequest,
//     res: Response,
//     next: NextFunction
// ) => {
//     passport.authenticate(
//         "jwt",
//         { session: false },
//         async (err: any, user: any, info: any) => {
//             if (err) {
//                 logger.error("JWT authentication error:", err);
//                 return sendErrorResponse(
//                     res,
//                     "Authentication failed",
//                     HTTP_STATUS.INTERNAL_SERVER_ERROR
//                 );
//             }

//             if (!user) {
//                 const message = info?.message || "Invalid or expired token";
//                 return sendErrorResponse(
//                     res,
//                     message,
//                     HTTP_STATUS.UNAUTHORIZED,
//                     ERROR_CODES.TOKEN_INVALID
//                 );
//             }

//             // Check if token is blacklisted
//             if (user.jwtPayload) {
//                 const isBlacklisted = await CacheService.isTokenBlacklisted(
//                     user.jwtPayload.jti || ""
//                 );
//                 if (isBlacklisted) {
//                     return sendErrorResponse(
//                         res,
//                         "Token has been revoked",
//                         HTTP_STATUS.UNAUTHORIZED,
//                         ERROR_CODES.TOKEN_INVALID
//                     );
//                 }
//             }

//             req.user = user.jwtPayload || user;
//             return next();
//         }
//     )(req, res, next);
// };

const verifyClientToken = async (
    req: AuthenticatedClientRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return sendErrorResponse(
                res,
                "Authorization token required",
                HTTP_STATUS.UNAUTHORIZED,
                ERROR_CODES.TOKEN_REQUIRED
            );
        }

        const token = authHeader.substring(7);

        // Verify and decode the token
        const decoded = await jwtUtil.verifyAccessToken(token);
        if (!decoded) {
            return sendErrorResponse(
                res,
                "Invalid or expired token",
                HTTP_STATUS.UNAUTHORIZED,
                ERROR_CODES.TOKEN_INVALID
            );
        }

        // Check if token is blacklisted
        const isBlacklisted = await CacheService.isTokenBlacklisted(token);
        if (isBlacklisted) {
            return sendErrorResponse(
                res,
                "Token has been revoked",
                HTTP_STATUS.UNAUTHORIZED,
                ERROR_CODES.TOKEN_INVALID
            );
        }

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            return sendErrorResponse(
                res,
                "Token has expired",
                HTTP_STATUS.UNAUTHORIZED,
                ERROR_CODES.TOKEN_EXPIRED
            );
        }

        const user = await Account.findById(decoded.userId) as any;
        if (!user) {
            return sendErrorResponse(
                res,
                "User not found",
                HTTP_STATUS.UNAUTHORIZED,
                ERROR_CODES.USER_NOT_FOUND
            );
        }
        if (user.isDeleted) {
            return sendErrorResponse(
                res,
                "Account has been deleted",
                HTTP_STATUS.UNAUTHORIZED,
                ERROR_CODES.USER_NOT_FOUND
            );
        }

        if (user.status === "restricted") {
            return sendErrorResponse(
                res,
                "Account has been suspended",
                HTTP_STATUS.FORBIDDEN,
                ERROR_CODES.ACCOUNT_SUSPENDED
            );
        }

        req.user = {
            ...user.toObject(),
            id: user._id.toString(),
            userId: user._id.toString(),
        };

        return next();
    } catch (error) {
        logger.error("Token verification error:", error);
        return sendErrorResponse(
            res,
            `Token verification failed ${error}`,
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODES.TOKEN_INVALID
        );
    }
};

const optionalClientAuth = async (
    req: AuthenticatedClientRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return next();
        }

        const token = authHeader.substring(7);

        const decoded = await jwtUtil.verifyAccessToken(token);
        if (!decoded) return next();

        const isBlacklisted = await CacheService.isTokenBlacklisted(token);
        if (isBlacklisted) return next();

        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) return next();

        const user = await Account.findById(decoded.userId) as any;
        if (!user) {
            return sendErrorResponse(
                res,
                "User not found",
                HTTP_STATUS.UNAUTHORIZED,
                ERROR_CODES.USER_NOT_FOUND
            );
        }

        if (user.status === "suspended") {
            return sendErrorResponse(
                res,
                "Account has been suspended",
                HTTP_STATUS.FORBIDDEN,
                ERROR_CODES.ACCOUNT_SUSPENDED
            );
        }

        req.user = {
            ...user.toObject(),
            id: user._id.toString(),
            userId: user._id.toString(),
        };
    } catch (error) { }

    return next();
};

const requireRole = (roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return sendErrorResponse(
                res,
                "Authentication required",
                HTTP_STATUS.UNAUTHORIZED
            );
        }

        if (!roles.includes(req.user.role)) {
            return sendErrorResponse(
                res,
                "Insufficient permissions, MUST BE A VENDOR TO PERFORM THIS ACTION",
                HTTP_STATUS.FORBIDDEN,
                ERROR_CODES.INSUFFICIENT_PERMISSIONS
            );
        }

        return next();
    };
};

// const getUserSubscriptionData = async (userId: string) => {
//     const cacheKey = `user_subscription:${userId}`;

//     let subscriptionData = await CacheService.get<{
//         subscriptionPlan?: string | undefined;
//         subscriptionEndDate?: Date | undefined;
//         subscriptionStartDate?: Date | undefined;
//     }>(cacheKey);

//     if (!subscriptionData) {
//         const user = await Account.findById(userId)
//             .select(
//                 "subscriptionPlan subscriptionStatus subscriptionEndDate subscriptionStartDate"
//             )
//             .lean();

//         if (user) {
//             subscriptionData = {
//                 subscriptionPlan: user.subscriptionPlan || "free",
//                 subscriptionEndDate: user.subscriptionEndDate,
//                 subscriptionStartDate: user.subscriptionStartDate,
//             };

//             await CacheService.set(cacheKey, subscriptionData, 300);
//         }
//     }

//     return subscriptionData;
// };

// const attachSubscriptionInfo = async (req: AuthenticatedRequest) => {
//     const { user } = req;

//     if (!user || user.role !== "vendor") {
//         return;
//     }

//     const subscriptionData = await getUserSubscriptionData(
//         user.userId || user.id
//     );

//     if (!subscriptionData) {
//         req.subscription = {
//             plan: "free" as const,
//             currentPeriod: {
//                 start: new Date(),
//                 end: null,
//             },
//             isExpired: false,
//             daysUntilExpiry: Infinity,
//         };
//         return;
//     }

//     const now = new Date();
//     const subscriptionPlan = subscriptionData.subscriptionPlan || "free";
//     const subscriptionEndDate = subscriptionData.subscriptionEndDate
//         ? new Date(subscriptionData.subscriptionEndDate)
//         : null;
//     const subscriptionStartDate = subscriptionData.subscriptionStartDate
//         ? new Date(subscriptionData.subscriptionStartDate)
//         : null;

//     // Check if subscription is expired (only for standard plans)
//     const isExpired =
//         subscriptionPlan === "standard" &&
//         subscriptionEndDate &&
//         now > subscriptionEndDate;

//     const daysUntilExpiry =
//         subscriptionPlan === "standard" && subscriptionEndDate
//             ? Math.ceil(
//                 (subscriptionEndDate.getTime() - now.getTime()) /
//                 (24 * 60 * 60 * 1000)
//             )
//             : Infinity;

//     req.subscription = {
//         plan: subscriptionPlan as "free" | "standard",
//         currentPeriod: {
//             start: subscriptionStartDate || new Date(),
//             end: subscriptionEndDate || new Date("2099-12-31"),
//         },
//         isExpired: isExpired || false,
//         daysUntilExpiry,
//     };
// };

// const allowFreePlan = async (
//     req: AuthenticatedRequest,
//     res: Response,
//     next: NextFunction
// ) => {
//     const { user } = req;

//     if (!user || user.role !== "vendor") {
//         sendErrorResponse(
//             res,
//             "Access denied. Vendors only.",
//             HTTP_STATUS.FORBIDDEN
//         );
//         return;
//     }

//     await attachSubscriptionInfo(req);

//     const subscriptionPlan = req.subscription?.plan || "free";

//     if (subscriptionPlan === "free") {
//         return next();
//     }

//     // For standard plan users, check if expired
//     if (subscriptionPlan === "standard" && req.subscription?.isExpired) {
//         return sendErrorResponse(
//             res,
//             "Your subscription has expired. Please renew to continue using premium features.",
//             HTTP_STATUS.PAYMENT_REQUIRED,
//             "SUBSCRIPTION_EXPIRED"
//         );
//     }

//     return next();
// };

// const requireStandardPlan = async (
//     req: AuthenticatedRequest,
//     res: Response,
//     next: NextFunction
// ) => {
//     const { user } = req;

//     if (!user || user.role !== "vendor") {
//         sendErrorResponse(
//             res,
//             "Access denied. Vendors only.",
//             HTTP_STATUS.FORBIDDEN
//         );
//         return;
//     }

//     await attachSubscriptionInfo(req);

//     const subscriptionPlan = req.subscription?.plan || "free";

//     // Check if user has standard plan
//     if (subscriptionPlan !== "standard") {
//         return sendErrorResponse(
//             res,
//             "This feature requires a Standard subscription plan",
//             HTTP_STATUS.PAYMENT_REQUIRED,
//             "SUBSCRIPTION_REQUIRED"
//         );
//     }

//     // Check if standard plan is expired
//     if (req.subscription?.isExpired) {
//         return sendErrorResponse(
//             res,
//             "Your subscription has expired. Please renew to continue using this feature.",
//             HTTP_STATUS.PAYMENT_REQUIRED,
//             "SUBSCRIPTION_EXPIRED"
//         );
//     }

//     return next();
// };

// const checkListingPermissions = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { user } = req;

//   if (!user || user.role !== "vendor") {
//     sendErrorResponse(
//       res,
//       "Access denied. Vendors only.",
//       HTTP_STATUS.FORBIDDEN
//     );
//     return;
//   }

//   await attachSubscriptionInfo(req);

//   const subscriptionPlan = req.subscription?.plan || "free";

//   // Free plan users can create/edit listings (basic functionality)
//   if (subscriptionPlan === "free") {
//     return next();
//   }

//   // Standard plan users - check if expired
//   if (subscriptionPlan === "standard" && req.subscription?.isExpired) {
//     // Even expired standard users can still use basic listing features
//     // Todo If required, restrict certain advanced listing features here
//     // For now, just log and allow
//     logger.warn(`Expired standard user ${user.id} accessing listing features`);
//     res.set("X-Subscription-Status", "expired");
//     return next();
//   }

//   return next();
// };

// const checkDraftStatus = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const vendorId = req.user?.id;

//   if (vendorId) {
//     try {
//       const listing = await Listing.findOne({ vendorId: vendorId });

//       if (!listing) {
//         return sendErrorResponse(
//           res,
//           "No listings found. Ready to create your first listing?",
//           HTTP_STATUS.NOT_FOUND
//         );
//       }

//       // Set draft operation flag
//       req.isDraftOperation = listing.status === "draft";
//     } catch (error) {
//       console.error("Error checking listing status:", error);
//       return sendErrorResponse(
//         res,
//         "Error accessing listing",
//         HTTP_STATUS.INTERNAL_SERVER_ERROR
//       );
//     }
//   } else if (req.method === "POST" && req.body?.status === "draft") {
//     req.isDraftOperation = true;
//   }

//   return next();
// };

// Non-blocking subscription status check
// const checkSubscriptionStatus = async (
//     req: AuthenticatedRequest,
//     res: Response,
//     next: NextFunction
// ) => {
//     await attachSubscriptionInfo(req);
//     next();
// };

// // For Premium features (standard plan required)
// const requireVendorWithStandardPlan = [
//     verifyClientToken,
//     requireRole(["vendor"]),
//     requireStandardPlan,
// ];

// // For basic vendor operations (allows free plan)
// const requireVendorBasicAccess = [
//     verifyClientToken,
//     requireRole(["vendor"]),
//     allowFreePlan,
// ];

// const requireVendorForListings = [
//   verifyClientToken,
//   requireRole(["vendor"]),
//   checkListingPermissions,
// ];

const authenticateWithSubscriptionCheck = [
    verifyClientToken,
    // checkSubscriptionStatus,
];

export {
    //authenticateJWT,
    verifyClientToken,
    requireRole,
    optionalClientAuth,

    // Subscription middlewares
    // requireStandardPlan, // For premium features only
    // allowFreePlan, // NEW: Allows free plan users
    //checkSubscriptionStatus,
    //checkListingPermissions, // NEW: For listing operations

    // Combined middlewares
    // requireVendorWithStandardPlan, // For premium features
    // requireVendorBasicAccess, // NEW: For basic vendor operations
    //requireVendorForListings, // NEW: For listing operations ( for posting listings)
    authenticateWithSubscriptionCheck,
};
