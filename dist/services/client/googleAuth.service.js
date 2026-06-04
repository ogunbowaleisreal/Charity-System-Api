"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuthService = void 0;
const firebase_1 = require("../../config/firebase");
const Accounts_1 = require("../../models/Accounts");
const jwt_1 = __importDefault(require("../../utils/jwt"));
const refresh_token_1 = require("../../models/refresh.token");
const constants_1 = require("../../utils/constants");
class GoogleAuthService {
    /**
     * Login using Firebase Google authentication
     * IMPORTANT:
     * - This does NOT create users
     * - User MUST already exist in DB
     */
    async loginWithGoogle(idToken, ip, userAgent) {
        /**
         * 1️⃣ Verify Firebase ID token
         * This confirms:
         * - Token is valid
         * - Issued by Firebase
         * - User authenticated with Google
         */
        const decodedToken = await firebase_1.firebaseAdmin
            .auth()
            .verifyIdToken(idToken);
        const { email, uid, email_verified } = decodedToken;
        console.log(decodedToken);
        if (!email) {
            throw {
                message: "Invalid Google token",
                statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED,
            };
        }
        if (!email_verified) {
            throw {
                message: "Email not verified with Google.",
                statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED,
            };
        }
        const existingGoogleUser = await Accounts_1.Account.findOne({ googleId: uid });
        if (existingGoogleUser && existingGoogleUser.email !== email) {
            throw {
                message: "Google account already linked to another user.",
                statusCode: constants_1.HTTP_STATUS.FORBIDDEN,
            };
        }
        /**
         * 2️⃣ Find existing account
         * NO AUTO-CREATION
         */
        const user = await Accounts_1.Account.findOne({ email });
        if (!user) {
            throw {
                message: "Account not found. Please register first.",
                statusCode: constants_1.HTTP_STATUS.NOT_FOUND,
            };
        }
        if (!user.googleId) {
            user.googleId = uid;
            await user.save();
        }
        else if (user.googleId !== uid) {
            throw {
                message: "Google account mismatch detected.",
                statusCode: constants_1.HTTP_STATUS.FORBIDDEN,
            };
        }
        /**
         * 3️⃣ Enforce provider
         * Prevent Google login on local/email accounts
         */
        // if (user.provider !== "google") {
        //     throw {
        //         message: "This account does not support Google login.",
        //         statusCode: HTTP_STATUS.FORBIDDEN,
        //     };
        // }
        // /**
        //  * Optional but recommended:
        //  * Ensure Firebase UID matches stored googleId
        //  */
        // if (user.googleId && user.googleId !== uid) {
        //     throw {
        //         message: "Google account mismatch detected.",
        //         statusCode: HTTP_STATUS.FORBIDDEN,
        //     };
        // }
        /**
         * 4️⃣ Account state checks
         */
        if (user.status === "suspended") {
            throw {
                message: "Account is restricted. Contact support.",
                statusCode: constants_1.HTTP_STATUS.FORBIDDEN,
            };
        }
        /**
         * 5️⃣ Generate access & refresh tokens
         * This uses your existing JWT utility
         */
        const tokens = jwt_1.default.generateTokenPair({
            userId: user._id,
            email: user.email,
            role: user.role,
        });
        /**
         * 6️⃣ Persist refresh token
         * Required for logout / rotation / revocation
         */
        await refresh_token_1.RefreshToken.create({
            tokenId: tokens.tokenId,
            userId: user._id,
            userType: user.role,
            token: tokens.refreshToken,
            revoked: false,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
            ),
            ipAddress: ip,
            userAgent,
        });
        /**
         * 7️⃣ Update last login
         */
        user.lastLogin = new Date();
        await user.save();
        return { user, tokens };
    }
}
exports.GoogleAuthService = GoogleAuthService;
// import { OAuth2Client } from "google-auth-library";
// import { Account } from "../../models/Accounts";
// import jwtUtil from "../../utils/jwt";
// import { RefreshToken } from "../../models/refresh.token";
// import { HTTP_STATUS } from "../../utils/constants";
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// export class GoogleAuthService {
//     async loginWithGoogle(idToken: string, ip?: string, userAgent?: string) {
//         // 1. Verify Google token
//         const ticket = await client.verifyIdToken({
//             idToken,
//             audience: process.env.GOOGLE_CLIENT_ID,
//         });
//         const payload = ticket.getPayload();
//         if (!payload?.email) {
//             throw {
//                 message: "Invalid Google token",
//                 statusCode: HTTP_STATUS.UNAUTHORIZED,
//             };
//         }
//         // 2. Find existing account
//         const user = await Account.findOne({ email: payload.email });
//         if (!user) {
//             throw {
//                 message: "Account not found. Please register using email & password.",
//                 statusCode: HTTP_STATUS.NOT_FOUND,
//             };
//         }
//         // 3. Provider enforcement
//         // if (user.provider !== "google") {
//         //     throw {
//         //         message: "This account does not support Google login.",
//         //         statusCode: HTTP_STATUS.FORBIDDEN,
//         //     };
//         // }
//         if (user.status === "restricted") {
//             throw {
//                 message: "Account is restricted. Contact support.",
//                 statusCode: HTTP_STATUS.FORBIDDEN,
//             };
//         }
//         // 4. Generate tokens
//         const tokens = jwtUtil.generateTokenPair({
//             userId: user._id as string,
//             email: user.email,
//             role: user.role,
//         });
//         // 5. Persist refresh token
//         await RefreshToken.create({
//             tokenId: tokens.tokenId,
//             userId: user._id,
//             userType: user.role,
//             token: tokens.refreshToken,
//             revoked: false,
//             expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//             ipAddress: ip,
//             userAgent,
//         });
//         // 6. Update last login
//         user.lastLogin = new Date();
//         await user.save();
//         return { user, tokens };
//     }
// }
