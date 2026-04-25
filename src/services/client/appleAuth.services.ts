import { firebaseAdmin } from "../../config/firebase";
import { Account } from "../../models/Accounts";
import jwtUtil from "../../utils/jwt";
import { RefreshToken } from "../../models/refresh.token";
import { HTTP_STATUS } from "../../utils/constants";

export class AppleAuthService {
    /**
     * Login using Firebase Apple authentication
     * IMPORTANT:
     * - Mirrors GoogleAuthService structure
     * - Does NOT create users
     */
    async loginWithApple(
        idToken: string,
        ip?: string,
        userAgent?: string
    ) {
        /**
         * 1️⃣ Verify Firebase ID token
         */
        const decodedToken = await firebaseAdmin
            .auth()
            .verifyIdToken(idToken);

        const { email, uid, email_verified, firebase } = decodedToken;

        /**
         * 2️⃣ Ensure this token is actually from Apple
         */
        if (firebase?.sign_in_provider !== "apple.com") {
            throw {
                message: "Invalid Apple authentication provider.",
                statusCode: HTTP_STATUS.UNAUTHORIZED,
            };
        }

        if (!uid) {
            throw {
                message: "Invalid Apple token",
                statusCode: HTTP_STATUS.UNAUTHORIZED,
            };
        }

        /**
         * ⚠️ Apple email caveat:
         * - May be hidden or missing
         */
        if (email && email_verified === false) {
            throw {
                message: "Apple email not verified.",
                statusCode: HTTP_STATUS.UNAUTHORIZED,
            };
        }

        /**
         * 3️⃣ Check for existing Apple-linked account
         */
        const existingAppleUser = await Account.findOne({
            appleId: uid,
        });

        if (existingAppleUser && email && existingAppleUser.email !== email) {
            throw {
                message: "Apple account already linked to another user.",
                statusCode: HTTP_STATUS.FORBIDDEN,
            };
        }

        /**
         * 4️⃣ Find existing account (NO AUTO-CREATION)
         * Prefer appleId → fallback email
         */
        let user = await Account.findOne({
            $or: [{ appleId: uid }, ...(email ? [{ email }] : [])],
        });

        if (!user) {
            throw {
                message: "Account not found. Please register first.",
                statusCode: HTTP_STATUS.NOT_FOUND,
            };
        }

        /**
         * 5️⃣ Link Apple account if not linked
         */
        if (!user.appleId) {
            user.appleId = uid;
            await user.save();
        } else if (user.appleId !== uid) {
            throw {
                message: "Apple account mismatch detected.",
                statusCode: HTTP_STATUS.FORBIDDEN,
            };
        }

        /**
         * 6️⃣ Account state checks
         */
        if (user.status === "suspended") {
            throw {
                message: "Account is restricted. Contact support.",
                statusCode: HTTP_STATUS.FORBIDDEN,
            };
        }

        /**
         * 7️⃣ Generate tokens (same as your system)
         */
        const tokens = jwtUtil.generateTokenPair({
            userId: user._id as string,
            email: user.email,
            role: user.role,
        });

        /**
         * 8️⃣ Persist refresh token
         */
        await RefreshToken.create({
            tokenId: tokens.tokenId,
            userId: user._id,
            userType: user.role,
            token: tokens.refreshToken,
            revoked: false,
            expiresAt: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
            ipAddress: ip,
            userAgent,
        });

        /**
         * 9️⃣ Update last login
         */
        user.lastLogin = new Date();
        await user.save();

        return { user, tokens };
    }
}