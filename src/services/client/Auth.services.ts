import mongoose from "mongoose";
import 'dotenv/config';
import { RefreshToken } from "../../models/refresh.token";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.utils";
import { randomString, hashToken, comparePassword, hashPassword } from "../../utils/hash.utils";
import bcryptUtil from "../../utils/bcryptutils";
import { CacheService } from "../../services/cacheServices";
import { Account } from "../../models/Accounts";
import jwtUtil from "../../utils/jwt";
import { OTPService } from "../otp.services";
import { IUser } from "../../models/Accounts";
import { LoginRequest, AuthResponse } from "../../types/auth";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { clientJwtPayload } from "../../types/clientAuth";


const otpService = new OTPService();

export class authService {

    private async saveRefreshToken(
        tokenId: string,
        userId: string,
        userType: string,
        token: string,
        ip?: string,
        userAgent?: string
    ): Promise<void> {
        const refreshToken = new RefreshToken({
            tokenId,
            userId,
            userType,
            token,
            ipAddress: ip,
            userAgent,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        await refreshToken.save();
        await CacheService.setRefreshToken(tokenId, { userId, userType });
    }

    private formatLoginResponse = async (
        user: IUser,
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        }
    ): Promise<AuthResponse> => {
        if (user.role === "client") {
            return {
                // message: "Account verified successfully",
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    isVerified: user.verified,
                    // profilePicture: user.profilePicture,
                    phone: user.phone,
                    // businessName: user.businessName,
                    companyName: user.companyName,
                    businessCategory: user.businessCategory,
                    // businessPhone: user.businessPhone,
                    // businessAddress: user.businessAddress,
                    // location: user.location,
                    // totalViews: user.totalViews,
                    // totalListings: user.totalListings,
                    // averageRating: user.averageRating,
                    // totalReviews: user.totalReviews,
                    subscriptionPlan: user.subscriptionPlan,
                    subscriptionStartDate: user.subscriptionStartDate,
                    subscriptionEndDate: user.subscriptionEndDate,
                    subscibtionStatus: user.subscriptionStatus,
                    // orderNotifications: user.orderNotifications,
                    // twoFactorEnabled: user.twoFactorEnabled,
                    //createdAt: user.createdAt,
                    //updatedAt: user.updatedAt,
                } as any,
                tokens,
            };
        }
        console.log("got here")
        return {
            // message: "Account verified successfully",
            user: {
                id: user._id as string,
                email: user.email,
                firstName: user.firstName,
                phone: user.phone,
                //profilePicture: user.profilePicture,
                lastName: user.lastName,
                role: user.role,
                gender: user.gender,
                isVerified: user.verified,

                //twoFactorEnabled: user.twoFactorEnabled,
            },
            tokens,
        };
    };

    async login(
        data: LoginRequest,
        ip?: string,
        userAgent?: string
    ): Promise<AuthResponse> {
        const { email, password } = data;

        // Find user
        const client = await Account.findOne({ email }).populate("businessCategory");
        if (!client) {
            throw { message: "Invalid credentials", statusCode: HTTP_STATUS.UNAUTHORIZED };
        }
        //console.log(client)
        //const user = await Account.findByEmail(email).select("+password");

        //     if (!user) {
        //       throw {
        //         message: "Invalid credentials",
        //         statusCode: HTTP_STATUS.UNAUTHORIZED,
        //       };
        //     }

        // check is account is verified
        // if (!user.isVerified) {
        //   this.otpService.generateAndSendOTP(email, "registration");
        //   throw {
        //     success: true,
        //     message:
        //       "Just one more step! We've sent a verification code to your email. Please check your inbox and enter the code to complete your login.",
        //     statusCode: HTTP_STATUS.LOCKED,
        //   };
        // }

        if (client.status === "restricted") {
            throw {
                message:
                    "Your account has been suspended by the administrator due to a violation of our policies. Please contact support for further assistance.",
                statusCode: HTTP_STATUS.FORBIDDEN,
            };
        }

        // // Check if account is locked
        // if (user.checkAccountLock()) {
        //   throw { message: "Account is locked", statusCode: HTTP_STATUS.LOCKED };
        // }

        // Verify password
        // const isPasswordValid = await user.comparePassword(password);
        // if (!isPasswordValid) {
        //   await user.incrementLoginAttempts();
        //   throw {
        //     message: "Invalid credentials",
        //     statusCode: HTTP_STATUS.UNAUTHORIZED,
        //   };
        // }

        // // Reset login attempts and update last login
        // await user.resetLoginAttempts();
        // user.lastLogin = new Date();
        // await user.save();

        // if (user.twoFactorEnabled) {
        //   this.otpService.generateAndSendOTP(email, "2fa");

        //   throw {
        //     message:
        //       "Just one more step! We've sent a verification code to your email. Please check your inbox and enter the code to complete your login.",
        //     success: true,
        //     statusCode: HTTP_STATUS.FORBIDDEN,
        //   };
        // }
        // compmare password for client
        const isPasswordValid = await bcryptUtil.comparePassword(
            password, client.password as string
        );
        if (!isPasswordValid) {
            throw { message: "Invalid credentials", statusCode: HTTP_STATUS.UNAUTHORIZED };
        }

        // // Generate tokens
        const tokens = jwtUtil.generateTokenPair({
            userId: client._id as string,
            email: client.email,
            role: client.role,
        });

        // Save refresh token
        await this.saveRefreshToken(
            tokens.tokenId,
            client._id as string,
            client.role,
            tokens.refreshToken,
            ip,
            userAgent
        );

        return this.formatLoginResponse(client, tokens);
    }

    async refreshToken(
        refreshToken: string
    ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
        // Verify refresh token
        const decoded = jwtUtil.verifyRefreshToken(refreshToken);
        console.log(decoded)
        // Find refresh token in database
        const tokenDoc = await RefreshToken.findActiveToken(decoded.tokenId);
        if (!tokenDoc) {
            throw {
                message: "Invalid refresh token",
                statusCode: HTTP_STATUS.UNAUTHORIZED,
            };
        }

        // Find user
        const client = await Account.findById(decoded.userId);
        if (!client) {
            throw { message: "User not found or inactive", statusCode: HTTP_STATUS.UNAUTHORIZED };
        }
        //const user = await Account.findById(decoded.userId);
        // if (!user || user.status !== "active") {
        //   throw {
        //     message: "User not found or inactive",
        //     statusCode: HTTP_STATUS.UNAUTHORIZED,
        //   };
        // }

        // Deactivate old token
        await tokenDoc.deactivate();

        // Generate new tokens
        const tokens = jwtUtil.generateTokenPair({
            userId: client._id as string,
            email: client.email,
            role: client.role,
        });

        // Save new refresh token
        await this.saveRefreshToken(
            tokens.tokenId,
            client._id as string,
            client.role,
            tokens.refreshToken
        );

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        };
    }

    async createUserSession(user: { user_id: any, role?: string, password?: string }) {
        const client = await Account.findById(user.user_id);
        if (!client) {
            throw new Error("User not found");
        }

        if (user.password) {
            const isPasswordValid = await comparePassword(user.password, client?.password as string);
            if (!isPasswordValid) {
                throw new Error("Invalid credentials");
            }
        }

        client!.lastLogin = new Date()
        await client!.save()

        const payload: clientJwtPayload = {
            user_id: client._id as string,
            role: user.role,
            permission: {}
        }
        const accessToken = signAccessToken(payload) as string;
        const { plainRefreshToken, hashedRefreshToken } = signRefreshToken();
        await RefreshToken.create({
            userId: user.user_id,
            token: hashedRefreshToken,
            tokenId: plainRefreshToken,
            userType: client.role,
            revoked: false,
        })

        return { accessToken, refreshToken: plainRefreshToken }
            ;

    }

    async deleteUserSessions(userId: mongoose.Types.ObjectId) {
        const deletedData = await RefreshToken.deleteMany({ userId: userId });
        if (deletedData.deletedCount && deletedData.deletedCount > 0) {
            return true;
        } else {
            return false;
        }
    }
    async deleteRefreshToken(token: string) {
        const hashedtoken = hashToken(token);
        const deletedData = await RefreshToken.deleteOne({ hashedToken: hashedtoken });
        if (deletedData.deletedCount && deletedData.deletedCount > 0) {
            return true;
        } else {
            return false;
        }
    }

    async verifyRefreshToken(token: string) {
        const hashedtoken = hashToken(token);
        const storedToken = await RefreshToken.findOne({ hashedToken: hashedtoken, revoked: false });
        return { storedToken };
    }

    async resetPassword(email: string, OTP: string, newPassword: string) {
        // try{
        const isValidOTP = await otpService.verifyOTP(email, OTP, "password_reset");
        // if (!isValidOTP) {
        //     throw new Error("Invalid or expired OTP");
        // }
        const user = await Account.findOne({ email, provider: 'local' });
        if (!user) {
            throw new Error("User not found");
        }
        const password = await bcryptUtil.hashPassword(newPassword);
        user.password = password
        await user.save();
        return true;
        // }catch(err:any){
        //     logger.error("password reset failed")
        // }
    }
    async changePassword(accountId: string, oldPassword: string, newPassword: string) {
        const clientAccount = await Account.findById(accountId)
        const hashedPassword = clientAccount?.password
        //console.log(clientAccount)
        if (!clientAccount) {
            return false
        }

        const verifyPassword = await bcryptUtil.comparePassword(oldPassword, hashedPassword as string)

        if (!verifyPassword) {
            return false
        }
        const newHashedPassword = await bcryptUtil.hashPassword(newPassword)
        clientAccount.password = newHashedPassword
        await clientAccount.save()
        return true
    }
}