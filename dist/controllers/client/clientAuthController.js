"use strict";
// import { NextFunction, Request, Response } from "express";
// import { AuthService } from "../../services/client/clientAuthServices";
// import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
// import { HTTP_STATUS } from "../../utils/constants";
// import logger from "../../logger";";
// import crypto from "crypto";
// import CacheService from "../../services/cacheServices";
// import { AuthenticatedRequest } from "@/types";
// export class AuthController {
//   private authService = new AuthService();
//   register = async (
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> => {
//     try {
//       const result = await this.authService.register(req.body);
//       sendSuccessResponse(
//         res,
//         result,
//         "Registration initiated. Please check your email for OTP.",
//         HTTP_STATUS.CREATED
//       );
//     } catch (error: any) {
//       logger.error("Register error:", error);
//       sendErrorResponse(
//         res,
//         error.message,
//         error.statusCode || HTTP_STATUS.BAD_REQUEST
//       );
//     }
//   };
//   updateVendor = async (
//     req: AuthenticatedRequest,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> => {
//     try {
//       const vendorId = req.user?.userId;
//       if (!vendorId) {
//         sendErrorResponse(
//           res,
//           "Vendor not authenticated",
//           HTTP_STATUS.UNAUTHORIZED
//         );
//         return;
//       }
//       const result = await this.authService.updateVendor(req.body, vendorId);
//       sendSuccessResponse(
//         res,
//         result,
//         "Listing created successfully. You can now add more details to your listing.",
//         HTTP_STATUS.CREATED
//       );
//     } catch (error: any) {
//       logger.error("Creating Listing from signup step 3 failed :", error);
//       next(error);
//     }
//   };
//   verifyOTP = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const result = await this.authService.verifyOTP(req.body);
//       sendSuccessResponse(res, result, "Account verified successfully");
//     } catch (error: any) {
//       logger.error("Verify OTP error:", error);
//       sendErrorResponse(
//         res,
//         error.message,
//         error.statusCode || HTTP_STATUS.BAD_REQUEST
//       );
//     }
//   };
//   verifyFPOTP = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const result = await this.authService.verifyFPOTP(req.body);
//       sendSuccessResponse(res, result, "Otp verified successfully");
//     } catch (error: any) {
//       logger.error("Verify OTP error:", error);
//       sendErrorResponse(
//         res,
//         error.message,
//         error.statusCode || HTTP_STATUS.BAD_REQUEST
//       );
//     }
//   };
//   verify2FA = async (req: Request, res: Response) => {
//     try {
//       const { email, otp } = req.body;
//       const result = await this.authService.verify2FA(email, otp);
//       sendSuccessResponse(res, result, "Login Successful");
//     } catch (error: any) {
//       logger.error("Verify 2fa OTP error:", error);
//       sendErrorResponse(
//         res,
//         error.message || "Invalid OTP",
//         error.statusCode || HTTP_STATUS.BAD_REQUEST
//       );
//     }
//   };
//   resendOTP = async (req: Request, res: Response): Promise<void> => {
//     try {
//       await this.authService.resendOTP(req.body.email);
//       sendSuccessResponse(res, null, "OTP sent successfully");
//     } catch (error: any) {
//       logger.error("Resend OTP error:", error);
//       sendErrorResponse(
//         res,
//         error.message,
//         error.statusCode || HTTP_STATUS.BAD_REQUEST
//       );
//     }
//   };
//   login = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const result = await this.authService.login(
//         req.body,
//         req.ip,
//         req.get("User-Agent")
//       );
//       // Check if this is a 2FA or verification response
//       if (result.message && !result.tokens) {
//         sendSuccessResponse(res, null, result.message);
//       } else {
//         sendSuccessResponse(res, result, "Login Successful");
//       }
//     } catch (error: any) {
//       logger.error("Login error:", error);
//       sendErrorResponse(
//         res,
//         error.message,
//         error.statusCode || HTTP_STATUS.BAD_REQUEST
//       );
//     }
//   };
//   logout = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const authHeader = req.headers.authorization;
//       await this.authService.logout(authHeader);
//       sendSuccessResponse(res, null, "Logout successful");
//     } catch (error: any) {
//       logger.error("Logout error:", error);
//       sendErrorResponse(
//         res,
//         error.message,
//         error.statusCode || HTTP_STATUS.BAD_REQUEST
//       );
//     }
//   };
//   logoutAll = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const authHeader = req.headers.authorization;
//       await this.authService.logoutAll(authHeader);
//       sendSuccessResponse(res, null, "Logged out from all devices");
//     } catch (error: any) {
//       logger.error("Logout all error:", error);
//       sendErrorResponse(
//         res,
//         error.message,
//         error.statusCode || HTTP_STATUS.BAD_REQUEST
//       );
//     }
//   };
//   refreshToken = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const result = await this.authService.refreshToken(req.body.refreshToken);
//       sendSuccessResponse(res, result, "Token refreshed successfully");
//     } catch (error: any) {
//       logger.error("Refresh token error:", error);
//       sendErrorResponse(
//         res,
//         error.message,
//         error.statusCode || HTTP_STATUS.BAD_REQUEST
//       );
//     }
//   };
//   forgotPassword = async (req: Request, res: Response): Promise<void> => {
//     try {
//       await this.authService.forgotPassword(req.body.email);
//       sendSuccessResponse(res, null, "Password reset OTP sent to your email");
//     } catch (error: any) {
//       logger.error("Forgot password error:", error);
//       sendErrorResponse(
//         res,
//         error.message,
//         error.statusCode || HTTP_STATUS.BAD_REQUEST
//       );
//     }
//   };
//   resetPassword = async (req: Request, res: Response): Promise<void> => {
//     try {
//       await this.authService.resetPassword(req.body);
//       sendSuccessResponse(res, null, "Password reset successful");
//     } catch (error: any) {
//       logger.error("Reset password error:", error);
//       sendErrorResponse(
//         res,
//         error.message,
//         error.statusCode || HTTP_STATUS.BAD_REQUEST
//       );
//     }
//   };
//   // googleCallback = async (req: Request, res: Response): Promise<void> => {
//   //   try {
//   //     const result = await this.authService.handleGoogleAuth(req.user);
//   //     const tempCode = crypto.randomBytes(32).toString("hex");
//   //     await CacheService.set(`google_auth_temp_code:${tempCode}`, result, 300);
//   //     const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
//   //     res.redirect(`${clientUrl}/auth/success?code=${tempCode}`);
//   //   } catch (error: any) {
//   //     logger.error("Google callback error:", error);
//   //     const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
//   //     res.redirect(`${clientUrl}/auth/error`);
//   //   }
//   // };
//   googleCallback = async (req: Request, res: Response): Promise<void> => {
//     try {
//       // At this point, req.user should always exist because failures are redirected
//       if (!req.user) {
//         // This should rarely happen now, but keep as safety net
//         const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
//         return res.redirect(`${clientUrl}/auth/error?message=No user found`);
//       }
//       const result = await this.authService.handleGoogleAuth(req.user);
//       const tempCode = crypto.randomBytes(32).toString("hex");
//       await CacheService.set(`google_auth_temp_code:${tempCode}`, result, 300);
//       const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
//       res.redirect(`${clientUrl}/auth/success?code=${tempCode}`);
//     } catch (error: any) {
//       // Handle any errors that occur in handleGoogleAuth or token generation
//       logger.error("Google callback processing error:", error);
//       const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
//       const errorMessage = encodeURIComponent(
//         error.message || "Authentication processing failed"
//       );
//       res.redirect(`${clientUrl}/auth/error?message=${errorMessage}`);
//     }
//   };
//   googleExchange = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const { code } = req.body;
//       if (!code) {
//         sendErrorResponse(
//           res,
//           "Code is required",
//           HTTP_STATUS.BAD_REQUEST || 400
//         );
//         return;
//       }
//       const tempData = await CacheService.get(`google_auth_temp_code:${code}`);
//       if (!tempData) {
//         sendErrorResponse(
//           res,
//           "Invalid or expired code",
//           HTTP_STATUS.NOT_FOUND
//         );
//         return;
//       }
//       await CacheService.delete(`google_auth_temp_code:${code}`);
//       // Type assertion to expected structure
//       const result = tempData as {
//         message?: string;
//         user: {
//           id: string;
//           email: string;
//           firstName: string;
//           lastName: string;
//           profilePicture: string;
//           role: string;
//           isVerified?: boolean;
//         };
//         tokens: {
//           accessToken: string;
//           refreshToken: string;
//           expiresIn: number;
//         };
//       };
//       res.json({
//         success: true,
//         message: result.message || "Google authentication successful",
//         user: result.user,
//         tokens: result.tokens,
//       });
//     } catch (error: any) {
//       sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST || 400);
//       logger.error("Google exchange error:", error);
//     }
//   };
// }
