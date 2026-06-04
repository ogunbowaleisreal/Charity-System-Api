"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateWithSubscriptionCheck = exports.optionalClientAuth = exports.requireRole = exports.verifyClientToken = void 0;
const jwt_1 = require("../utils/jwt");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../utils/constants");
const cacheServices_1 = require("../services/cacheServices");
const logger_1 = __importDefault(require("../logger"));
const Accounts_1 = require("../models/Accounts");
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
const verifyClientToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return (0, helpers_1.sendErrorResponse)(res, "Authorization token required", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.TOKEN_REQUIRED);
        }
        const token = authHeader.substring(7);
        // Verify and decode the token
        const decoded = await jwt_1.jwtUtil.verifyAccessToken(token);
        if (!decoded) {
            return (0, helpers_1.sendErrorResponse)(res, "Invalid or expired token", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.TOKEN_INVALID);
        }
        // Check if token is blacklisted
        const isBlacklisted = await cacheServices_1.CacheService.isTokenBlacklisted(token);
        if (isBlacklisted) {
            return (0, helpers_1.sendErrorResponse)(res, "Token has been revoked", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.TOKEN_INVALID);
        }
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            return (0, helpers_1.sendErrorResponse)(res, "Token has expired", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.TOKEN_EXPIRED);
        }
        const user = await Accounts_1.Account.findById(decoded.userId);
        if (!user) {
            return (0, helpers_1.sendErrorResponse)(res, "User not found", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.USER_NOT_FOUND);
        }
        if (user.isDeleted) {
            return (0, helpers_1.sendErrorResponse)(res, "Account has been deleted", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.USER_NOT_FOUND);
        }
        if (user.status === "restricted") {
            return (0, helpers_1.sendErrorResponse)(res, "Account has been suspended", constants_1.HTTP_STATUS.FORBIDDEN, constants_1.ERROR_CODES.ACCOUNT_SUSPENDED);
        }
        req.user = {
            ...user.toObject(),
            id: user._id.toString(),
            userId: user._id.toString(),
        };
        return next();
    }
    catch (error) {
        logger_1.default.error("Token verification error:", error);
        return (0, helpers_1.sendErrorResponse)(res, `Token verification failed ${error}`, constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.TOKEN_INVALID);
    }
};
exports.verifyClientToken = verifyClientToken;
const optionalClientAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return next();
        }
        const token = authHeader.substring(7);
        const decoded = await jwt_1.jwtUtil.verifyAccessToken(token);
        if (!decoded)
            return next();
        const isBlacklisted = await cacheServices_1.CacheService.isTokenBlacklisted(token);
        if (isBlacklisted)
            return next();
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime)
            return next();
        const user = await Accounts_1.Account.findById(decoded.userId);
        if (!user) {
            return (0, helpers_1.sendErrorResponse)(res, "User not found", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.USER_NOT_FOUND);
        }
        if (user.status === "suspended") {
            return (0, helpers_1.sendErrorResponse)(res, "Account has been suspended", constants_1.HTTP_STATUS.FORBIDDEN, constants_1.ERROR_CODES.ACCOUNT_SUSPENDED);
        }
        req.user = {
            ...user.toObject(),
            id: user._id.toString(),
            userId: user._id.toString(),
        };
    }
    catch (error) { }
    return next();
};
exports.optionalClientAuth = optionalClientAuth;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return (0, helpers_1.sendErrorResponse)(res, "Authentication required", constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        if (!roles.includes(req.user.role)) {
            return (0, helpers_1.sendErrorResponse)(res, "Insufficient permissions, MUST BE A VENDOR TO PERFORM THIS ACTION", constants_1.HTTP_STATUS.FORBIDDEN, constants_1.ERROR_CODES.INSUFFICIENT_PERMISSIONS);
        }
        return next();
    };
};
exports.requireRole = requireRole;
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
exports.authenticateWithSubscriptionCheck = authenticateWithSubscriptionCheck;
