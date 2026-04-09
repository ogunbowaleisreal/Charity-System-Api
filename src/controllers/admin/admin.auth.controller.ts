import { NextFunction, Request, Response } from "express";
import { AuthService } from "../../services/admin/adminauthservice";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import adminJwtUtil from "../../utils/admin/jwt";
import Admin from "../../models/AdminModel";

export class AuthController {
    private authService = new AuthService();

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.substring(7);

                try {
                    const decoded = adminJwtUtil.verifyAccessToken(token);
                    if (decoded && !adminJwtUtil.isTokenExpired(token)) {
                        // Check if token is still active in database
                        const admin = await Admin.findById(decoded.adminId).select(
                            "+activeTokenId"
                        );
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
                } catch (error) {
                    logger.debug("Existing token invalid, proceeding with login", {
                        ip: req.ip,
                    });
                }
            }

            const result = await this.authService.login(
                req.body,
                req.ip,
                req.get("User-Agent")
            );

            logger.info("Admin login successful", {
                adminId: result.admin?.id,
                adminEmail: result.admin?.email,
                ip: req.ip,
            });

            if (result.message && !result.tokens) {
                sendSuccessResponse(res, { "admin": result.data }, result.message);
            } else {
                sendSuccessResponse(res, result, "Login Successful");
            }
        } catch (error: any) {
            logger.error("Admin login failed", {
                error: error.message,
                email: req.body.email,
                ip: req.ip,
            });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    verify2FA = async (req: Request, res: Response) => {
        try {
            const { email, otp } = req.body;
            const result = await this.authService.verify2FA(
                email,
                otp,
                req.ip,
                req.get("User-Agent")
            );
            const tokens = result.token;
            const admin = result.admin;
            logger.info("Admin login successful", {
                adminId: result.admin?.id,
                adminEmail: result.admin?.email,
                ip: req.ip,
            });

            sendSuccessResponse(res, { admin, tokens }, "Login Successful");
        } catch (error: any) {
            logger.error("Verify 2fa OTP error:", error);
            sendErrorResponse(
                res,
                error.message || "Invalid OTP",
                error.statusCode || HTTP_STATUS.BAD_REQUEST
            );
        }
    };

    logout = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            await this.authService.logout(req.get("Authorization"));
            logger.info("Admin logout successful", { adminId: req.admin?.adminId });
            sendSuccessResponse(res, {}, "Logout successful");
        } catch (error: any) {
            logger.error("Admin logout failed", { error: error.message });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    refreshToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.authService.refreshToken(req.body.refreshToken);
            sendSuccessResponse(res, result, "Token refreshed successfully");
        } catch (error: any) {
            logger.error("Admin token refresh failed", { error: error.message });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    forgotPassword = async (req: Request, res: Response): Promise<void> => {
        try {
            await this.authService.forgotPassword(req.body.email);
            sendSuccessResponse(res, "Password reset OTP sent successfully");
        } catch (error: any) {
            logger.error("Admin forgot password failed", { error: error.message });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    resetPassword = async (req: Request, res: Response): Promise<void> => {
        try {
            await this.authService.resetPassword(req.body);
            logger.info("Admin password reset successful", { email: req.body.email });
            sendSuccessResponse(res, "Password reset successful");
        } catch (error: any) {
            logger.error("Admin password reset failed", { error: error.message });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };
}

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