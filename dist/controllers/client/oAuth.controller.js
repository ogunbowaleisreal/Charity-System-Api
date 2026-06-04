"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthController = void 0;
const oauth_services_1 = require("../../services/oauth.services");
const Auth_services_1 = require("../../services/client/Auth.services");
const google_1 = require("../../config/google");
const oauthservice = new oauth_services_1.oauthService();
const authservice = new Auth_services_1.authService();
class oauthController {
    async getGoogleAuthUrl(req, res) {
        const url = google_1.oauth2Client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
        });
        res.status(200).json({ "url": url });
    }
    async googleOAuthCallback(req, res) {
        try {
            const code = req.query.code;
            if (!code) {
                return res.status(400).json({ "messsge": "invalid or no code sent" });
            }
            const response = await oauthservice.handleGoogleCallback(code);
            const { accessToken, refreshToken } = await authservice.createUserSession({
                user_id: response.user_id,
                role: response.role
            });
            // res.cookie("refreshToken", refreshToken, {
            //     httpOnly: true,
            //     secure: process.env.NODE_ENV === "production",
            //     sameSite: "strict",
            //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days  
            // })
            res.status(200).json({ message: "OAuth successful", accessToken, refreshToken });
        }
        catch (err) {
            res.status(500).json({ message: "Internal Server Error", error: err });
        }
    }
}
exports.oauthController = oauthController;
