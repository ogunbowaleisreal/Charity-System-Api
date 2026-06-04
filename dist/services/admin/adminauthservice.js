"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const AdminModel_1 = require("../../models/AdminModel");
const refresh_token_1 = require("../../models/refresh.token");
const bcryptutils_1 = require("../../utils/bcryptutils");
const otp_services_1 = __importDefault(require("../../services/otp.services"));
const cacheServices_1 = require("../../services/cacheServices");
const constants_1 = require("../../utils/constants");
const jwt_1 = __importDefault(require("../../utils/admin/jwt"));
const logger_1 = __importDefault(require("../../logger"));
class AuthService {
    constructor() {
        this.otpService = new otp_services_1.default();
    }
    async login(data, ip, userAgent) {
        const { email, password } = data;
        const admin = await AdminModel_1.Admin.findOne({ email }).select("+password +activeTokenId");
        if (!admin) {
            console.log("Admin not found for email:", email);
            throw {
                message: "Invalid credentials",
                statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED,
            };
        }
        if (admin.status == "suspended") {
            throw {
                message: "Your account has been suspended. Contact support.",
                statusCode: constants_1.HTTP_STATUS.FORBIDDEN, // 403 is more accurate than 401
            };
        }
        if (admin.isLocked()) {
            throw { message: "Account is locked", statusCode: constants_1.HTTP_STATUS.LOCKED };
        }
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            console.log("Admin not found  2 for email:", email);
            await admin.incrementLoginAttempts();
            throw {
                message: "Invalid credentials",
                statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED,
            };
        }
        await admin.resetLoginAttempts();
        admin.lastLogin = new Date();
        if (admin.activeTokenId) {
            logger_1.default.info("Invalidating previous session for new login", {
                adminId: admin._id,
                previousTokenId: admin.activeTokenId,
            });
            try {
                const previousTokenDoc = await refresh_token_1.RefreshToken.findActiveToken(admin.activeTokenId);
                if (previousTokenDoc) {
                    const previousDecoded = jwt_1.default.decodeToken(previousTokenDoc.token);
                    if (previousDecoded?.family) {
                        await jwt_1.default.invalidateTokenFamily(previousDecoded.family, admin._id.toString());
                    }
                }
            }
            catch (error) {
                logger_1.default.warn("Could not invalidate previous token family", { error });
            }
            await refresh_token_1.RefreshToken.deactivateAllUserTokens(admin._id.toString(), "admin");
        }
        //  Two-Factor Authentication
        if (admin.twoFactorEnabled) {
            admin.activeTokenId = null;
            await admin.save();
            this.otpService.generateAndSendOTP(email, "2fa");
            return {
                success: true,
                data: admin,
                statusCode: constants_1.HTTP_STATUS.LOCKED,
                message: "Just one more step! We've sent a verification code to your email. Please check your inbox and enter the code to complete your login.",
            };
        }
        // Generate new token pair (creates new family)
        const tokens = jwt_1.default.generateTokenPair({
            adminId: admin._id.toString(),
            email: admin.email,
            adminLevel: admin.adminLevel,
            deviceInfo: userAgent,
        });
        // Store refresh token metadata for reuse detection
        await jwt_1.default.storeRefreshTokenMetadata(tokens.tokenId, admin._id.toString(), tokens.family, tokens.generation, {
            ip,
            userAgent,
            loginType: "password",
        });
        // Update admin with new active session
        admin.activeTokenId = tokens.tokenId;
        admin.lastActiveAt = new Date();
        admin.totalLogins = (admin.totalLogins || 0) + 1;
        await admin.save();
        await this.saveRefreshToken(tokens.tokenId, admin._id.toString(), "admin", tokens.refreshToken, ip, userAgent, tokens.family, tokens.generation);
        logger_1.default.info("New login session created", {
            adminId: admin._id.toString(),
            tokenId: tokens.tokenId,
            family: tokens.family,
            generation: tokens.generation,
        });
        return {
            admin: {
                id: admin._id.toString(),
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
                phone: admin.phone,
                adminLevel: admin.adminLevel,
                twoFactorEnabled: admin.twoFactorEnabled,
                profilePicture: admin.profilePicture,
                permissions: admin.permissions,
            },
            tokens: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn,
            },
        };
    }
    async verify2FA(email, otp, ip, userAgent) {
        const admin = await AdminModel_1.Admin.findByEmail(email);
        if (!admin) {
            throw { message: "Admin not found", statusCode: constants_1.HTTP_STATUS.NOT_FOUND };
        }
        await this.otpService.verifyOTP(email, otp, "2fa");
        const tokens = jwt_1.default.generateTokenPair({
            adminId: admin._id.toString(),
            email: admin.email,
            adminLevel: admin.adminLevel,
        });
        admin.activeTokenId = tokens.tokenId;
        admin.lastActiveAt = new Date();
        admin.totalLogins = (admin.totalLogins || 0) + 1;
        await admin.save();
        // Save refresh token
        await this.saveRefreshToken(tokens.tokenId, admin._id.toString(), "admin", tokens.refreshToken, ip, userAgent);
        return {
            // admin: {
            //     id: admin._id.toString(),
            //     email: admin.email,
            //     firstName: admin.firstName,
            //     lastName: admin.lastName,
            //     adminLevel: admin.adminLevel,
            //     twoFactorEnabled: admin.twoFactorEnabled,
            //     profilePicture: admin.profilePicture,
            // },
            admin,
            token: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn,
            }
        };
    }
    async logout(authHeader) {
        if (!authHeader)
            return;
        const token = jwt_1.default.extractTokenFromHeader(authHeader);
        if (!token)
            return;
        try {
            const decoded = jwt_1.default.decodeToken(token);
            if (decoded?.adminId) {
                await AdminModel_1.Admin.findByIdAndUpdate(decoded.adminId, {
                    activeTokenId: null,
                    lastActiveAt: new Date(),
                });
                // Find and invalidate the token family
                if (decoded.tokenId) {
                    try {
                        const tokenDoc = await refresh_token_1.RefreshToken.findActiveToken(decoded.tokenId);
                        if (tokenDoc) {
                            const refreshDecoded = jwt_1.default.decodeToken(tokenDoc.token);
                            if (refreshDecoded?.family) {
                                await jwt_1.default.invalidateTokenFamily(refreshDecoded.family, decoded.adminId);
                            }
                        }
                    }
                    catch (error) {
                        logger_1.default.warn("Could not invalidate token family during logout", {
                            error,
                        });
                    }
                    await refresh_token_1.RefreshToken.deactivateAllUserTokens(decoded.adminId, "admin");
                }
                logger_1.default.info("Admin logged out successfully", {
                    adminId: decoded.adminId,
                    tokenId: decoded.tokenId,
                });
            }
            //           await CacheService.blacklistToken(token);
        }
        catch (error) {
            logger_1.default.error("Logout error:", error);
            //           await CacheService.blacklistToken(token);
            throw new Error("Logout failed");
        }
    }
    async refreshToken(refreshToken, ip, userAgent) {
        try {
            const decoded = jwt_1.default.verifyRefreshToken(refreshToken);
            const isSuspicious = await jwt_1.default.detectTokenReuse(decoded);
            if (isSuspicious) {
                await jwt_1.default.handleSuspiciousActivity(decoded);
                throw {
                    message: "Security violation detected. All sessions invalidated.",
                    statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED,
                };
            }
            const tokenDoc = await refresh_token_1.RefreshToken.findActiveToken(decoded.tokenId);
            if (!tokenDoc) {
                logger_1.default.warn("Refresh token not found in database", {
                    adminId: decoded.adminId,
                    tokenId: decoded.tokenId,
                    family: decoded.family,
                });
                // This could indicate token theft - invalidate the family
                await jwt_1.default.invalidateTokenFamily(decoded.family, decoded.adminId);
                throw {
                    message: "Invalid refresh token",
                    statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED,
                };
            }
            // Verify admin
            const admin = await AdminModel_1.Admin.findById(decoded.adminId);
            if (!admin || admin.status !== "active") {
                throw {
                    message: "Admin not found or inactive",
                    statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED,
                };
            }
            await jwt_1.default.markTokenAsUsed(decoded.tokenId);
            await tokenDoc.deactivate();
            // Generating new token pair with rotation (same family, incremented generation)
            const tokens = jwt_1.default.generateTokenPair({
                adminId: admin._id.toString(),
                email: admin.email,
                adminLevel: admin.adminLevel,
                family: decoded.family,
                generation: decoded.generation,
                deviceInfo: userAgent,
            });
            await jwt_1.default.storeRefreshTokenMetadata(tokens.tokenId, admin._id.toString(), tokens.family, tokens.generation, {
                ip,
                userAgent,
                previousTokenId: decoded.tokenId,
            });
            await this.saveRefreshToken(tokens.tokenId, admin._id.toString(), "admin", tokens.refreshToken, ip, userAgent, tokens.family, tokens.generation);
            admin.activeTokenId = tokens.tokenId;
            admin.lastActiveAt = new Date();
            await admin.save();
            logger_1.default.info("Refresh token rotated successfully", {
                adminId: admin._id.toString(),
                oldTokenId: decoded.tokenId,
                newTokenId: tokens.tokenId,
                family: tokens.family,
                oldGeneration: decoded.generation,
                newGeneration: tokens.generation,
            });
            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn,
            };
        }
        catch (error) {
            if (error.message?.includes("TOKEN_EXPIRED") ||
                error.message?.includes("TOKEN_INVALID")) {
                try {
                    const decoded = jwt_1.default.decodeToken(refreshToken);
                    if (decoded?.family && decoded?.adminId) {
                        logger_1.default.warn("Invalid/expired token used - potential security issue", {
                            adminId: decoded.adminId,
                            family: decoded.family,
                        });
                        await jwt_1.default.invalidateTokenFamily(decoded.family, decoded.adminId);
                    }
                }
                catch (decodeError) {
                    logger_1.default.warn("Malformed refresh token attempted");
                }
            }
            throw error;
        }
    }
    async forgotPassword(email) {
        const admin = await AdminModel_1.Admin.findOne({ email });
        if (!admin) {
            throw new Error("Admin Account not found");
            return;
        }
        await this.otpService.generateAndSendOTP(email, "password_reset");
    }
    async resetPassword(data) {
        const { email, otp, newPassword } = data;
        const admin = await AdminModel_1.Admin.findOne({ email }).select("+password +passwordHistory");
        if (!admin) {
            throw { message: "Admin not found", statusCode: constants_1.HTTP_STATUS.NOT_FOUND };
        }
        // Verify OTP
        await this.otpService.verifyOTP(email, otp, "password_reset");
        // Check password history
        if (await bcryptutils_1.bcryptUtil.isPasswordInHistory(newPassword, admin.passwordHistory)) {
            throw {
                message: "Cannot reuse recent passwords",
                statusCode: constants_1.HTTP_STATUS.BAD_REQUEST,
            };
        }
        // Update password
        const hashedPassword = await bcryptutils_1.bcryptUtil.hashPassword(newPassword);
        admin.password = newPassword;
        admin.passwordHistory = bcryptutils_1.bcryptUtil.updatePasswordHistory(admin.passwordHistory, hashedPassword);
        await admin.save();
        // Invalidate all refresh tokens
        await refresh_token_1.RefreshToken.deactivateAllUserTokens(admin._id.toString(), "admin");
    }
    async saveRefreshToken(tokenId, userId, userType, token, ip, userAgent, family, generation) {
        const refreshToken = new refresh_token_1.RefreshToken({
            tokenId,
            userId,
            userType,
            token,
            ipAddress: ip,
            userAgent,
            family: family || "unknown",
            generation: generation || 0,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        await refreshToken.save();
        await cacheServices_1.CacheService.setRefreshToken(tokenId, {
            userId,
            userType,
            family,
            generation,
        });
    }
}
exports.AuthService = AuthService;
// import mongoose from "mongoose";
// import { Admin } from "../../models/admin";
// import { hashToken } from "../../utils/hash.utils";
// import { comparePassword, hashPassword } from "../../utils/hash.utils";
// import { signAccessToken, signRefreshToken } from "../../utils/jwt.utils";
// import { refreshToken } from "../../models/refresh.token"
// interface AdminAuthPayload {
//     admin_id: mongoose.Types.ObjectId;
//     role: { id: mongoose.Types.ObjectId; name: string };
// }
// export class adminAuthService {
//     // Admin authentication related methods would go here
//     async adminLogin(admin_id: mongoose.Types.ObjectId, password: string) {
//         const admin = await Admin.findById(admin_id).populate('role');
//         if (!admin || admin.adminLevel !== 'admin') {
//             throw new Error("Admin not found");
//         }
//         const hashedPassword = await hashPassword(password);
//         const isPasswordValid = await comparePassword(password, hashedPassword);
//         if (!isPasswordValid) {
//             throw new Error("Invalid credentials");
//         }
//         const payload = {
//             admin_id: admin._id,
//             role: {
//                 id: admin.role._id,
//                 name: admin.role.name,
//                 permissions: admin.role.permissions
//             }
//         }
//         const accessToken = signAccessToken(payload) as string;
//         const { plainRefreshToken, hashedRefreshToken } = signRefreshToken();
//         await refreshToken.create({
//             adminId: admin._id,
//             hashedToken: hashedRefreshToken,
//             revoked: false,
//         });
//         return { accessToken, refreshToken: plainRefreshToken };
//     }
//     logoutAdmin(adminId: mongoose.Types.ObjectId) {
//         return refreshToken.deleteMany({ adminId: adminId });
//     }
//     async adminRefreshToken(token: string) {
//         try {
//             const hashedtoken = hashToken(token);
//             const Token = await refreshToken.findOne({ hashedToken: hashedtoken, revoked: false });
//             if (!Token) {
//                 throw new Error("Invalid refresh token");
//             }
//             const admin = await Admin.findById(Token?.adminId);
//             if (admin) {
//                 return signAccessToken({ admin_id: admin._id, role: admin.role }) as string;
//             }
//         } catch (err) {
//             throw new Error("Invalid refresh token");
//         }// Payload to be filled after verifying the refresh token
//     }
// }
