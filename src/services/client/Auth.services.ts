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
import { IAccount } from "../../models/Accounts";
import { IKYC } from "../../models/KYC";
import { LoginRequest, AuthResponse } from "../../types/auth";
import { HTTP_STATUS } from "../../utils/constants";
import { KYC } from "../../models/KYC";
//import OTPService from "../otp.services";
import logger from "../../logger";
import { clientJwtPayload } from "../../types/clientAuth";



const otpService = new OTPService();

export class authService {

    async saveRefreshToken(
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

    formatLoginResponse = async (
        user: IAccount,
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        },
        kyc?: IKYC
    ): Promise<AuthResponse> => {
        if (user.role === "user") {
            return {
                message: "Account verified successfully",
                user: {
                    id: user._id,

                    // ===== BASIC =====
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,

                    role: user.role,
                    provider: user.provider,

                    // ===== STATUS =====
                    status: user.status,
                    isVerified: user.isVerified,
                    // kycStatus: user.kycStatus,

                    // ===== PROFILE =====
                    gender: user.gender,
                    dateOfBirth: user.dateOfBirth,
                    houseAddress: user.houseAddress,
                    country: user.country,
                    state: user.state,
                    visibility: user.visibility,
                    profilePicture: user.profilePicture,

                    // ===== ORGANIZATION =====
                    // companyName: user.companyName,
                    // organizationType: user.organizationType,
                    // logo: user.logo,
                    // about: user.about,
                    // businessAddress: user.businessAddress,

                    // ===== SOCIALS =====
                    website: user.website,
                    instagram: user.instagram,
                    facebook: user.facebook,
                    x: user.x,
                    tiktok: user.tiktok,
                    youtube: user.youtube,
                    snapchat: user.snapchat,

                    // // ===== KYC =====
                    // facialVerification: user.facialVerification,
                    // bvn: user.bvn,
                    // cacDocument: user.cacDocument,
                    // addressVerification: user.addressVerification,

                    // // ===== BANK =====
                    // bankName: user.bankName,
                    // accountNumber: user.accountNumber,
                    // accountName: user.accountName,
                    // bankCode: user.bankCode,

                    // ===== SECURITY =====
                    twoFactorEnabled: user.twoFactorEnabled,
                    twoFactorWithdrawalEnabled:
                        user.twoFactorWithdrawalEnabled,
                    isWalletPinSet: user.isWalletPinSet,

                    // ===== LOGIN INFO =====
                    lastLogin: user.lastLogin,
                    // lastLoginIp: user.lastLoginIp,
                    // lastLoginLocation: user.lastLoginLocation,

                    // ===== FLAGS =====
                    // isDeleted: user.isDeleted,

                    // ===== META =====
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,

                    // ===== EXTRA =====
                    kyc,
                } as any,
                tokens,
            };
        }
        // console.log("got here")
        return {
            message: "Account verified successfully",
            user: {
                id: user._id as string,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                profilePicture: user.profilePicture,
                logo: user.logo,
                //lastName: user.lastName,
                role: user.role,
                gender: user.gender,
                provider: user.provider,
                isVerified: user.isVerified,
                twoFactorEnabled: user.twoFactorEnabled,
                companyName: user.companyName,
                organizationType: user.organizationType,
                // website: user.website,
                instagram: user.instagram,
                facebook: user.facebook,
                x: user.x,
                tiktok: user.tiktok,
                youtube: user.youtube,
                snapchat: user.snapchat,

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
        const client = await Account.findOne({ email });
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
        // if (!client.isVerified) {
        //     otpService.generateAndSendOTP(email, "registration");
        //     throw {
        //         success: true,
        //         message:
        //             "Just one more step! We've sent a verification code to your email. Please check your inbox and enter the code to complete your login.",
        //         statusCode: HTTP_STATUS.LOCKED,
        //     };
        // }
        if (client.isDeleted) {
            throw {
                message: "Account has been deleted",
                statusCode: HTTP_STATUS.FORBIDDEN,
            };
        }

        if (client.status === "suspended") {
            throw {
                message:
                    "Your account has been suspended by the administrator due to a violation of our policies. Please contact support for further assistance.",
                statusCode: HTTP_STATUS.FORBIDDEN,
            };
        }

        if (client.isVerified === false) {
            otpService.generateAndSendOTP(email, "registration");
            throw {
                success: false,
                message:
                    "Just one more step! We've sent a verification code to your email. Please check your inbox and enter the code to complete your login.",
                statusCode: HTTP_STATUS.LOCKED,
            };
            // throw {
            //     message: "Account has not been verified",
            //     statusCode: HTTP_STATUS.FORBIDDEN,
            // };
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

        // compmare password for client
        const isPasswordValid = await bcryptUtil.comparePassword(
            password, client.password as string
        );
        if (!isPasswordValid) {
            throw { message: "Invalid credential", statusCode: HTTP_STATUS.UNAUTHORIZED };
        }


        if (client.twoFactorEnabled) {
            await otpService.generateAndSendOTP(email, "2fa");

            return {
                message:
                    "Just one more step! We've sent a verification code to your email. Please check your inbox and enter the code to complete your login.",
                success: true,
                statusCode: HTTP_STATUS.NO_CONTENT,
            };
        }
        // console.log(client.password)
        // console.log(password)

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

        const kyc = await KYC.findOne({ userId: client._id }).select("-_id -__v  -bvn -utilityBill -cacDocument -facialImage");
        if (!kyc) {
            return this.formatLoginResponse(client, tokens);
        }

        return this.formatLoginResponse(client, tokens, kyc);
    }

    async verify2FA(email: string, otp: string) {
        const client = await Account.findOne({ email });
        if (!client) {
            throw { message: "User not found", statusCode: HTTP_STATUS.NOT_FOUND };
        }
        // const user = await Account.findByEmail(email);
        // if (!user) {
        //   throw { message: "User not found", statusCode: HTTP_STATUS.NOT_FOUND };
        // }

        const verified = await otpService.verifyOTP(email, otp, "2fa");
        if (!verified) throw new Error("Invalid OTP")

        const tokens = jwtUtil.generateTokenPair({
            userId: client._id as string,
            email: client.email,
            role: client.role,
        });

        await this.saveRefreshToken(
            tokens.tokenId,
            client._id as string,
            client.role,
            tokens.refreshToken
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
        //const hashedtoken = hashToken(token);
        const deletedData = await RefreshToken.deleteOne({ token: token });
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
        // console.log("got here first ")
        const isValidOTP = await otpService.verifyOTP(email, OTP, "password_reset");
        if (!isValidOTP) {
            throw new Error("Invalid or expired OTP");
        }
        // console.log("i got here at all")
        const user = await Account.findOne({ email, provider: 'local' });
        // console.log(user)
        if (!user) {
            throw new Error("User not found");
        }
        const password = await bcryptUtil.hashPassword(newPassword);
        user.password = password
        await user.save();
        // console.log(user)
        return true;
        // }catch(err:any){
        //     logger.error("password reset failed")
        // }
    }

    async verifyPasswordResetOTP(email: string, otp: string) {
        const isValidOTP = await otpService.verifyOTP(
            email,
            otp,
            "password_reset"
        );

        if (!isValidOTP) {
            throw new Error("Invalid or expired OTP");
        }

        await CacheService.set(
            `password_reset_verified:${email}`,
            true,
            600
        );

        return true;
    }

    async verifyAndResetPassword(
        email: string,
        newPassword: string
    ) {
        const verified = await CacheService.get(
            `password_reset_verified:${email}`
        );

        if (!verified) {
            throw new Error("OTP verification required");
        }

        const user = await Account.findOne({
            email,
            provider: "local"
        });

        if (!user) {
            throw new Error("User not found");
        }

        const hashedPassword =
            await bcryptUtil.hashPassword(newPassword);

        user.password = hashedPassword;

        await user.save();

        // clear verification session
        await CacheService.delete(
            `password_reset_verified:${email}`
        );

        return true;
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