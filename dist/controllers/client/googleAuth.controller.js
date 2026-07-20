"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuthController = void 0;
const googleAuth_service_1 = require("../../services/client/googleAuth.service");
const Auth_services_1 = require("../../services/client/Auth.services");
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const googleAuthService = new googleAuth_service_1.GoogleAuthService();
const authservice = new Auth_services_1.authService();
class GoogleAuthController {
    async googleLogin(req, res, next) {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                return res
                    .status(400)
                    .json({ message: "Google ID token is required" });
            }
            /**
             * Delegate login logic to service
             */
            const { user, tokens } = await googleAuthService.loginWithGoogle(idToken, req.ip, req.headers["user-agent"]);
            /**
             * Reuse existing formatter for consistency
             */
            const response = await authservice["formatLoginResponse"](user, tokens);
            return res.status(200).json({
                message: "Google login successful",
                response,
            });
        }
        catch (err) {
            logger_1.default.error(err.message);
            (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode);
            //  next(err);
        }
    }
}
exports.GoogleAuthController = GoogleAuthController;
// import { Request, Response, NextFunction } from "express";
// import { GoogleAuthService } from "../../services/client/googleAuth.service";
// import { authService } from "../../services/client/Auth.services";
// const googleAuthService = new GoogleAuthService();
// const authservice = new authService();
// export class GoogleAuthController {
//     async googleLogin(req: Request, res: Response, next: NextFunction) {
//         try {
//             const { idToken } = req.body;
//             if (!idToken) {
//                 return res.status(400).json({ message: "Google ID token is required" });
//             }
//             const { user, tokens } = await googleAuthService.loginWithGoogle(
//                 idToken,
//                 req.ip,
//                 req.headers["user-agent"]
//             );
//             // reuse existing formatter for consistency
//             const response = await authservice["formatLoginResponse"](user, tokens);
//             return res.status(200).json({
//                 message: "Google login successful",
//                 response,
//             });
//         } catch (err) {
//             next(err);
//         }
//     }
// }
// import { Request, Response } from "express";
// import { oauthService } from "../../services/oauth.services";
// import { authService } from "../../services/client/Auth.services";
// import { oauth2Client } from "../../config/google";
// import mongoose from "mongoose";
// const oauthservice = new oauthService()
// const authservice = new authService()
// export class oauthController {
//     async getGoogleAuthUrl(req: Request, res: Response) {
//         const url = oauth2Client.generateAuthUrl({
//             access_type: "offline",
//             prompt: "consent",
//             scope: [
//                 "https://www.googleapis.com/auth/userinfo.profile",
//                 "https://www.googleapis.com/auth/userinfo.email",
//             ],
//         });
//         res.status(200).json({ "url": url });
//     }
//     async googleOAuthCallback(req: Request, res: Response) {
//         try {
//             const code = req.query.code as string;
//             if (!code) {
//                 return res.status(400).json({ "messsge": "invalid or no code sent" })
//             }
//             const response = await oauthservice.handleGoogleCallback(code)
//             const { accessToken, refreshToken } = await authservice.createUserSession({
//                 user_id: (response.user_id as mongoose.Types.ObjectId),
//                 role: response.role
//             });
//             // res.cookie("refreshToken", refreshToken, {
//             //     httpOnly: true,
//             //     secure: process.env.NODE_ENV === "production",
//             //     sameSite: "strict",
//             //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//             // })
//             res.status(200).json({ message: "OAuth successful", accessToken, refreshToken });
//         } catch (err) {
//             res.status(500).json({ message: "Internal Server Error", error: err })
//         }
//     }
// }
