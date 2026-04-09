import { Admin } from "../../models/AdminModel";
import { RefreshToken } from "../../models/refresh.token";
import { bcryptUtil } from "../../utils/bcryptutils";
import OTPService from "../../services/otp.services";
import { CacheService } from "../../services/cacheServices";
import { HTTP_STATUS } from "../../utils/constants";
import { LoginRequest } from "../../types/auth";
import adminJwtUtil from "../../utils/admin/jwt";
import { IAdmin } from "../../types/admin.management";
import logger from "../../logger";

export class AuthService {
    private otpService = new OTPService();

    async login(data: LoginRequest, ip?: string, userAgent?: string) {
        const { email, password } = data;

        const admin = await Admin.findOne({ email }).select(
            "+password +activeTokenId"
        );

        if (!admin) {
            console.log("Admin not found for email:", email);
            throw {
                message: "Invalid credentials",
                statusCode: HTTP_STATUS.UNAUTHORIZED,
            };
        }
        if (admin.status == "suspended") {
            throw {
                message: "Your account has been suspended. Contact support.",
                statusCode: HTTP_STATUS.FORBIDDEN, // 403 is more accurate than 401
            };
        }

        if (admin.isLocked()) {
            throw { message: "Account is locked", statusCode: HTTP_STATUS.LOCKED };
        }


        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            console.log("Admin not found  2 for email:", email);
            await admin.incrementLoginAttempts();
            throw {
                message: "Invalid credentials",
                statusCode: HTTP_STATUS.UNAUTHORIZED,
            };
        }

        await admin.resetLoginAttempts();
        admin.lastLogin = new Date();

        if (admin.activeTokenId) {
            logger.info("Invalidating previous session for new login", {
                adminId: admin._id,
                previousTokenId: admin.activeTokenId,
            });

            try {
                const previousTokenDoc = await RefreshToken.findActiveToken(
                    admin.activeTokenId
                );
                if (previousTokenDoc) {
                    const previousDecoded = adminJwtUtil.decodeToken(
                        previousTokenDoc.token
                    );
                    if (previousDecoded?.family) {
                        await adminJwtUtil.invalidateTokenFamily(
                            previousDecoded.family,
                            admin._id.toString()
                        );
                    }
                }
            } catch (error) {
                logger.warn("Could not invalidate previous token family", { error });
            }

            await RefreshToken.deactivateAllUserTokens(admin._id.toString(), "admin");
        }

        //  Two-Factor Authentication
        if (admin.twoFactorEnabled) {
            admin.activeTokenId = null;
            await admin.save();

            this.otpService.generateAndSendOTP(email, "2fa");
            return {
                success: true,
                data: admin,
                statusCode: HTTP_STATUS.LOCKED,
                message:
                    "Just one more step! We've sent a verification code to your email. Please check your inbox and enter the code to complete your login.",
            };
        }

        // Generate new token pair (creates new family)
        const tokens = adminJwtUtil.generateTokenPair({
            adminId: admin._id.toString(),
            email: admin.email,
            adminLevel: admin.adminLevel,
            deviceInfo: userAgent,
        });

        // Store refresh token metadata for reuse detection
        await adminJwtUtil.storeRefreshTokenMetadata(
            tokens.tokenId,
            admin._id.toString(),
            tokens.family,
            tokens.generation,
            {
                ip,
                userAgent,
                loginType: "password",
            }
        );

        // Update admin with new active session
        admin.activeTokenId = tokens.tokenId;
        admin.lastActiveAt = new Date();
        admin.totalLogins = (admin.totalLogins || 0) + 1;
        await admin.save();

        await this.saveRefreshToken(
            tokens.tokenId,
            admin._id.toString(),
            "admin",
            tokens.refreshToken,
            ip,
            userAgent,
            tokens.family,
            tokens.generation
        );

        logger.info("New login session created", {
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

    async verify2FA(email: string, otp: string, ip?: string, userAgent?: string) {
        const admin = await Admin.findByEmail(email);
        if (!admin) {
            throw { message: "Admin not found", statusCode: HTTP_STATUS.NOT_FOUND };
        }

        await this.otpService.verifyOTP(email, otp, "2fa");

        const tokens = adminJwtUtil.generateTokenPair({
            adminId: admin._id.toString(),
            email: admin.email,
            adminLevel: admin.adminLevel,
        });

        admin.activeTokenId = tokens.tokenId;
        admin.lastActiveAt = new Date();
        admin.totalLogins = (admin.totalLogins || 0) + 1;
        await admin.save();

        // Save refresh token
        await this.saveRefreshToken(
            tokens.tokenId,
            admin._id.toString(),
            "admin",
            tokens.refreshToken,
            ip,
            userAgent
        );

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

    async logout(authHeader?: string): Promise<void> {
        if (!authHeader) return;

        const token = adminJwtUtil.extractTokenFromHeader(authHeader);
        if (!token) return;

        try {
            const decoded = adminJwtUtil.decodeToken(token);

            if (decoded?.adminId) {
                await Admin.findByIdAndUpdate(decoded.adminId, {
                    activeTokenId: null,
                    lastActiveAt: new Date(),
                });

                // Find and invalidate the token family
                if (decoded.tokenId) {
                    try {
                        const tokenDoc = await RefreshToken.findActiveToken(
                            decoded.tokenId
                        );
                        if (tokenDoc) {
                            const refreshDecoded = adminJwtUtil.decodeToken(tokenDoc.token);
                            if (refreshDecoded?.family) {
                                await adminJwtUtil.invalidateTokenFamily(
                                    refreshDecoded.family,
                                    decoded.adminId
                                );
                            }
                        }
                    } catch (error) {
                        logger.warn("Could not invalidate token family during logout", {
                            error,
                        });
                    }

                    await RefreshToken.deactivateAllUserTokens(decoded.adminId, "admin");
                }

                logger.info("Admin logged out successfully", {
                    adminId: decoded.adminId,
                    tokenId: decoded.tokenId,
                });
            }

            //           await CacheService.blacklistToken(token);
        } catch (error) {
            logger.error("Logout error:", error);
            //           await CacheService.blacklistToken(token);
            throw new Error("Logout failed");
        }
    }

    async refreshToken(
        refreshToken: string,
        ip?: string,
        userAgent?: string
    ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
        try {
            const decoded = adminJwtUtil.verifyRefreshToken(refreshToken);

            const isSuspicious = await adminJwtUtil.detectTokenReuse(decoded);
            if (isSuspicious) {
                await adminJwtUtil.handleSuspiciousActivity(decoded);
                throw {
                    message: "Security violation detected. All sessions invalidated.",
                    statusCode: HTTP_STATUS.UNAUTHORIZED,
                };
            }

            const tokenDoc = await RefreshToken.findActiveToken(decoded.tokenId);
            if (!tokenDoc) {
                logger.warn("Refresh token not found in database", {
                    adminId: decoded.adminId,
                    tokenId: decoded.tokenId,
                    family: decoded.family,
                });

                // This could indicate token theft - invalidate the family
                await adminJwtUtil.invalidateTokenFamily(
                    decoded.family,
                    decoded.adminId
                );

                throw {
                    message: "Invalid refresh token",
                    statusCode: HTTP_STATUS.UNAUTHORIZED,
                };
            }

            // Verify admin
            const admin = await Admin.findById(decoded.adminId);
            if (!admin || admin.status !== "active") {
                throw {
                    message: "Admin not found or inactive",
                    statusCode: HTTP_STATUS.UNAUTHORIZED,
                };
            }

            await adminJwtUtil.markTokenAsUsed(decoded.tokenId);

            await tokenDoc.deactivate();

            // Generating new token pair with rotation (same family, incremented generation)
            const tokens = adminJwtUtil.generateTokenPair({
                adminId: admin._id.toString(),
                email: admin.email,
                adminLevel: admin.adminLevel,
                family: decoded.family,
                generation: decoded.generation,
                deviceInfo: userAgent,
            });

            await adminJwtUtil.storeRefreshTokenMetadata(
                tokens.tokenId,
                admin._id.toString(),
                tokens.family,
                tokens.generation,
                {
                    ip,
                    userAgent,
                    previousTokenId: decoded.tokenId,
                }
            );

            await this.saveRefreshToken(
                tokens.tokenId,
                admin._id.toString(),
                "admin",
                tokens.refreshToken,
                ip,
                userAgent,
                tokens.family,
                tokens.generation
            );

            admin.activeTokenId = tokens.tokenId;
            admin.lastActiveAt = new Date();
            await admin.save();

            logger.info("Refresh token rotated successfully", {
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
        } catch (error: any) {
            if (
                error.message?.includes("TOKEN_EXPIRED") ||
                error.message?.includes("TOKEN_INVALID")
            ) {
                try {
                    const decoded = adminJwtUtil.decodeToken(refreshToken);
                    if (decoded?.family && decoded?.adminId) {
                        logger.warn(
                            "Invalid/expired token used - potential security issue",
                            {
                                adminId: decoded.adminId,
                                family: decoded.family,
                            }
                        );

                        await adminJwtUtil.invalidateTokenFamily(
                            decoded.family,
                            decoded.adminId
                        );
                    }
                } catch (decodeError) {
                    logger.warn("Malformed refresh token attempted");
                }
            }

            throw error;
        }
    }

    async forgotPassword(email: string): Promise<void> {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            throw new Error("Admin Account not found");
            return;
        }

        await this.otpService.generateAndSendOTP(email, "password_reset");
    }

    async resetPassword(data: {
        email: string;
        otp: string;
        newPassword: string;
    }): Promise<void> {
        const { email, otp, newPassword } = data;

        const admin = await Admin.findOne({ email }).select(
            "+password +passwordHistory"
        );
        if (!admin) {
            throw { message: "Admin not found", statusCode: HTTP_STATUS.NOT_FOUND };
        }

        // Verify OTP
        await this.otpService.verifyOTP(email, otp, "password_reset");

        // Check password history
        if (
            await bcryptUtil.isPasswordInHistory(newPassword, admin.passwordHistory)
        ) {
            throw {
                message: "Cannot reuse recent passwords",
                statusCode: HTTP_STATUS.BAD_REQUEST,
            };
        }

        // Update password
        const hashedPassword = await bcryptUtil.hashPassword(newPassword);
        admin.password = newPassword;
        admin.passwordHistory = bcryptUtil.updatePasswordHistory(
            admin.passwordHistory,
            hashedPassword
        );
        await admin.save();

        // Invalidate all refresh tokens
        await RefreshToken.deactivateAllUserTokens(admin._id.toString(), "admin");
    }

    private async saveRefreshToken(
        tokenId: string,
        userId: string,
        userType: string,
        token: string,
        ip?: string,
        userAgent?: string,
        family?: string,
        generation?: number
    ): Promise<void> {
        const refreshToken = new RefreshToken({
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
        await CacheService.setRefreshToken(tokenId, {
            userId,
            userType,
            family,
            generation,
        });
    }
}

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