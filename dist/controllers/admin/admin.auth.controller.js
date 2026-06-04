"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const adminauthservice_1 = require("../../services/admin/adminauthservice");
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const jwt_1 = __importDefault(require("../../utils/admin/jwt"));
const AdminModel_1 = __importDefault(require("../../models/AdminModel"));
class AuthController {
    constructor() {
        this.authService = new adminauthservice_1.AuthService();
        this.login = async (req, res) => {
            try {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith("Bearer ")) {
                    const token = authHeader.substring(7);
                    try {
                        const decoded = jwt_1.default.verifyAccessToken(token);
                        if (decoded && !jwt_1.default.isTokenExpired(token)) {
                            // Check if token is still active in database
                            const admin = await AdminModel_1.default.findById(decoded.adminId).select("+activeTokenId");
                            // if (admin && admin.activeTokenId === decoded.tokenId) {
                            //     logger.info("Admin already authenticated", {
                            //         adminId: decoded.adminId,
                            //         ip: req.ip,
                            //     });
                            //     sendSuccessResponse(
                            //         res,
                            //         {
                            //             admin: {
                            //                 id: admin._id,
                            //                 firstName: admin.firstName,
                            //                 lastName: admin.lastName,
                            //                 email: admin.email,
                            //                 adminLevel: admin.adminLevel,
                            //                 permissions: admin.permissions,
                            //                 profilePicture: admin.profilePicture,
                            //             },
                            //             message: "Already authenticated",
                            //         },
                            //         "Already logged in"
                            //     );
                            //     return;
                            // }
                        }
                    }
                    catch (error) {
                        logger_1.default.debug("Existing token invalid, proceeding with login", {
                            ip: req.ip,
                        });
                    }
                }
                const result = await this.authService.login(req.body, req.ip, req.get("User-Agent"));
                logger_1.default.info("Admin login successful", {
                    adminId: result.admin?.id,
                    adminEmail: result.admin?.email,
                    ip: req.ip,
                });
                if (result.message && !result.tokens) {
                    (0, helpers_1.sendSuccessResponse)(res, { "admin": result.data }, result.message);
                }
                else {
                    (0, helpers_1.sendSuccessResponse)(res, result, "Login Successful");
                }
            }
            catch (error) {
                logger_1.default.error("Admin login failed", {
                    error: error.message,
                    email: req.body.email,
                    ip: req.ip,
                });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.verify2FA = async (req, res) => {
            try {
                const { email, otp } = req.body;
                const result = await this.authService.verify2FA(email, otp, req.ip, req.get("User-Agent"));
                const tokens = result.token;
                const admin = result.admin;
                logger_1.default.info("Admin login successful", {
                    adminId: result.admin?.id,
                    adminEmail: result.admin?.email,
                    ip: req.ip,
                });
                (0, helpers_1.sendSuccessResponse)(res, { admin, tokens }, "Login Successful");
            }
            catch (error) {
                logger_1.default.error("Verify 2fa OTP error:", error);
                (0, helpers_1.sendErrorResponse)(res, error.message || "Invalid OTP", error.statusCode || constants_1.HTTP_STATUS.BAD_REQUEST);
            }
        };
        this.logout = async (req, res) => {
            try {
                await this.authService.logout(req.get("Authorization"));
                logger_1.default.info("Admin logout successful", { adminId: req.admin?.adminId });
                (0, helpers_1.sendSuccessResponse)(res, {}, "Logout successful");
            }
            catch (error) {
                logger_1.default.error("Admin logout failed", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.refreshToken = async (req, res) => {
            try {
                const result = await this.authService.refreshToken(req.body.refreshToken);
                (0, helpers_1.sendSuccessResponse)(res, result, "Token refreshed successfully");
            }
            catch (error) {
                logger_1.default.error("Admin token refresh failed", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.forgotPassword = async (req, res) => {
            try {
                await this.authService.forgotPassword(req.body.email);
                (0, helpers_1.sendSuccessResponse)(res, "Password reset OTP sent successfully");
            }
            catch (error) {
                logger_1.default.error("Admin forgot password failed", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
        this.resetPassword = async (req, res) => {
            try {
                await this.authService.resetPassword(req.body);
                logger_1.default.info("Admin password reset successful", { email: req.body.email });
                (0, helpers_1.sendSuccessResponse)(res, "Password reset successful");
            }
            catch (error) {
                logger_1.default.error("Admin password reset failed", { error: error.message });
                (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
        };
    }
}
exports.AuthController = AuthController;
// import { Request, Response } from "express";
// import { adminAuthService } from "../../services/admin/adminauthservice";
// const adminauthservice = new adminAuthService()
// export class adminAuthController {
//     async login(req: Request, res: Response) {
//         try {
//             const { email, password } = req.body;
//             if (!email || !password) {
//                 return res.status(400).json({ message: "email and password are required" })
//             }
//             const { accessToken, refreshToken } = await adminauthservice.adminLogin(email, password)
//             // res.cookie("refreshToken", refreshToken, {
//             //     httpOnly: true,
//             //     secure: process.env.NODE_ENV === "production",
//             //     sameSite: "strict",
//             //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//             // });
//             return res.status(200).json({ message: "Login successful", accessToken, refreshToken });
//         } catch (err) {
//             return res.status(500).json({ message: "Internal Server Error", error: err })
//         }
//     }
//     async logout(req: Request, res: Response) {
//         try {
//             const refreshToken = req.cookies.refreshToken;
//             if (!refreshToken) {
//                 return res.status(400).json({ message: "No refresh token provided" });
//             }
//             const deleted = await adminauthservice.logoutAdmin(refreshToken);
//             if (deleted.acknowledged) {
//                 return res.status(200).json({ message: "Logout successful" });
//             }
//         } catch (err) {
//             return res.status(500).json({ message: "Internal Server Error", error: err })
//         }
//     }
//     async refreshToken(req: Request, res: Response) {
//         try {
//             const refreshToken = req.cookies.refreshToken;
//             const newAccessToken = await adminauthservice.adminRefreshToken(refreshToken);
//             if (newAccessToken) {
//                 return res.status(200).json({ accessToken: newAccessToken });
//             }
//         } catch (err) {
//             return res.status(500).json({ message: "Internal Server Error", error: err })
//         }
//     }
// }
