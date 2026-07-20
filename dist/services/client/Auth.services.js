"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
require("dotenv/config");
const refresh_token_1 = require("../../models/refresh.token");
const jwt_utils_1 = require("../../utils/jwt.utils");
const hash_utils_1 = require("../../utils/hash.utils");
const bcryptutils_1 = __importDefault(require("../../utils/bcryptutils"));
const cacheServices_1 = require("../../services/cacheServices");
const Accounts_1 = require("../../models/Accounts");
const jwt_1 = __importDefault(require("../../utils/jwt"));
const otp_services_1 = require("../otp.services");
const constants_1 = require("../../utils/constants");
const KYC_1 = require("../../models/KYC");
const otpService = new otp_services_1.OTPService();
class authService {
    constructor() {
        this.formatLoginResponse = async (user, tokens, kyc) => {
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
                        twoFactorWithdrawalEnabled: user.twoFactorWithdrawalEnabled,
                        isWalletPinSet: user.isWalletPinSet,
                        isBankDetailCreated: user.isBankDetailCreated,
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
                    },
                    tokens,
                };
            }
            // console.log("got here")
            return {
                message: "Account verified successfully",
                user: {
                    id: user._id,
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
                    isbankDetailCreated: user.isBankDetailCreated,
                    twoFactorWithdrawalEnabled: user.twoFactorWithdrawalEnabled,
                    isWalletPinSet: user.isWalletPinSet,
                    // website: user.website,
                    instagram: user.instagram,
                    facebook: user.facebook,
                    x: user.x,
                    tiktok: user.tiktok,
                    youtube: user.youtube,
                    snapchat: user.snapchat,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    kyc
                    //twoFactorEnabled: user.twoFactorEnabled,
                },
                tokens,
            };
        };
    }
    async saveRefreshToken(tokenId, userId, userType, token, ip, userAgent) {
        const refreshToken = new refresh_token_1.RefreshToken({
            tokenId,
            userId,
            userType,
            token,
            ipAddress: ip,
            userAgent,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
        await refreshToken.save();
        await cacheServices_1.CacheService.setRefreshToken(tokenId, { userId, userType });
    }
    async login(data, ip, userAgent) {
        const { email, password } = data;
        // Find user
        const client = await Accounts_1.Account.findOne({ email });
        if (!client) {
            throw { message: "Invalid credentials", statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED };
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
                statusCode: constants_1.HTTP_STATUS.FORBIDDEN,
            };
        }
        if (client.status === "suspended") {
            throw {
                message: "Your account has been suspended by the administrator due to a violation of our policies. Please contact support for further assistance.",
                statusCode: constants_1.HTTP_STATUS.FORBIDDEN,
            };
        }
        if (client.isVerified === false) {
            otpService.generateAndSendOTP(email, "registration");
            throw {
                success: false,
                message: "Just one more step! We've sent a verification code to your email. Please check your inbox and enter the code to complete your login.",
                statusCode: constants_1.HTTP_STATUS.LOCKED,
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
        const isPasswordValid = await bcryptutils_1.default.comparePassword(password, client.password);
        if (!isPasswordValid) {
            throw { message: "Invalid credential", statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED };
        }
        if (client.twoFactorEnabled) {
            await otpService.generateAndSendOTP(email, "2fa");
            return {
                message: "Just one more step! We've sent a verification code to your email. Please check your inbox and enter the code to complete your login.",
                success: true,
                statusCode: constants_1.HTTP_STATUS.NO_CONTENT,
            };
        }
        // console.log(client.password)
        // console.log(password)
        // // Generate tokens
        const tokens = jwt_1.default.generateTokenPair({
            userId: client._id,
            email: client.email,
            role: client.role,
        });
        // Save refresh token
        await this.saveRefreshToken(tokens.tokenId, client._id, client.role, tokens.refreshToken, ip, userAgent);
        const kyc = await KYC_1.KYC.findOne({ userId: client._id }).select("-_id -__v  -bvn -utilityBill -cacDocument -facialImage");
        if (!kyc) {
            return this.formatLoginResponse(client, tokens);
        }
        return this.formatLoginResponse(client, tokens, kyc);
    }
    async verify2FA(email, otp) {
        const client = await Accounts_1.Account.findOne({ email });
        if (!client) {
            throw { message: "User not found", statusCode: constants_1.HTTP_STATUS.NOT_FOUND };
        }
        // const user = await Account.findByEmail(email);
        // if (!user) {
        //   throw { message: "User not found", statusCode: HTTP_STATUS.NOT_FOUND };
        // }
        const verified = await otpService.verifyOTP(email, otp, "2fa");
        if (!verified)
            throw new Error("Invalid OTP");
        const tokens = jwt_1.default.generateTokenPair({
            userId: client._id,
            email: client.email,
            role: client.role,
        });
        await this.saveRefreshToken(tokens.tokenId, client._id, client.role, tokens.refreshToken);
        return this.formatLoginResponse(client, tokens);
    }
    async refreshToken(refreshToken) {
        // Verify refresh token
        const decoded = jwt_1.default.verifyRefreshToken(refreshToken);
        console.log(decoded);
        // Find refresh token in database
        const tokenDoc = await refresh_token_1.RefreshToken.findActiveToken(decoded.tokenId);
        if (!tokenDoc) {
            throw {
                message: "Invalid refresh token",
                statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED,
            };
        }
        // Find user
        const client = await Accounts_1.Account.findById(decoded.userId);
        if (!client) {
            throw { message: "User not found or inactive", statusCode: constants_1.HTTP_STATUS.UNAUTHORIZED };
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
        const tokens = jwt_1.default.generateTokenPair({
            userId: client._id,
            email: client.email,
            role: client.role,
        });
        // Save new refresh token
        await this.saveRefreshToken(tokens.tokenId, client._id, client.role, tokens.refreshToken);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        };
    }
    async createUserSession(user) {
        const client = await Accounts_1.Account.findById(user.user_id);
        if (!client) {
            throw new Error("User not found");
        }
        if (user.password) {
            const isPasswordValid = await (0, hash_utils_1.comparePassword)(user.password, client?.password);
            if (!isPasswordValid) {
                throw new Error("Invalid credentials");
            }
        }
        client.lastLogin = new Date();
        await client.save();
        const payload = {
            user_id: client._id,
            role: user.role,
            permission: {}
        };
        const accessToken = (0, jwt_utils_1.signAccessToken)(payload);
        const { plainRefreshToken, hashedRefreshToken } = (0, jwt_utils_1.signRefreshToken)();
        await refresh_token_1.RefreshToken.create({
            userId: user.user_id,
            token: hashedRefreshToken,
            tokenId: plainRefreshToken,
            userType: client.role,
            revoked: false,
        });
        return { accessToken, refreshToken: plainRefreshToken };
    }
    async deleteUserSessions(userId) {
        const deletedData = await refresh_token_1.RefreshToken.deleteMany({ userId: userId });
        if (deletedData.deletedCount && deletedData.deletedCount > 0) {
            return true;
        }
        else {
            return false;
        }
    }
    async deleteRefreshToken(token) {
        //const hashedtoken = hashToken(token);
        const deletedData = await refresh_token_1.RefreshToken.deleteOne({ token: token });
        if (deletedData.deletedCount && deletedData.deletedCount > 0) {
            return true;
        }
        else {
            return false;
        }
    }
    async verifyRefreshToken(token) {
        const hashedtoken = (0, hash_utils_1.hashToken)(token);
        const storedToken = await refresh_token_1.RefreshToken.findOne({ hashedToken: hashedtoken, revoked: false });
        return { storedToken };
    }
    async resetPassword(email, OTP, newPassword) {
        // try{
        // console.log("got here first ")
        const isValidOTP = await otpService.verifyOTP(email, OTP, "password_reset");
        if (!isValidOTP) {
            throw new Error("Invalid or expired OTP");
        }
        // console.log("i got here at all")
        const user = await Accounts_1.Account.findOne({ email, provider: 'local' });
        // console.log(user)
        if (!user) {
            throw new Error("User not found");
        }
        const password = await bcryptutils_1.default.hashPassword(newPassword);
        user.password = password;
        await user.save();
        // console.log(user)
        return true;
        // }catch(err:any){
        //     logger.error("password reset failed")
        // }
    }
    async verifyPasswordResetOTP(email, otp) {
        const isValidOTP = await otpService.verifyOTP(email, otp, "password_reset");
        if (!isValidOTP) {
            throw new Error("Invalid or expired OTP");
        }
        await cacheServices_1.CacheService.set(`password_reset_verified:${email}`, true, 600);
        return true;
    }
    async verifyAndResetPassword(email, newPassword) {
        const verified = await cacheServices_1.CacheService.get(`password_reset_verified:${email}`);
        if (!verified) {
            throw new Error("OTP verification required");
        }
        const user = await Accounts_1.Account.findOne({
            email,
            provider: "local"
        });
        if (!user) {
            throw new Error("User not found");
        }
        const hashedPassword = await bcryptutils_1.default.hashPassword(newPassword);
        user.password = hashedPassword;
        await user.save();
        // clear verification session
        await cacheServices_1.CacheService.delete(`password_reset_verified:${email}`);
        return true;
    }
    async changePassword(accountId, oldPassword, newPassword) {
        const clientAccount = await Accounts_1.Account.findById(accountId);
        const hashedPassword = clientAccount?.password;
        //console.log(clientAccount)
        if (!clientAccount) {
            return false;
        }
        const verifyPassword = await bcryptutils_1.default.comparePassword(oldPassword, hashedPassword);
        if (!verifyPassword) {
            return false;
        }
        const newHashedPassword = await bcryptutils_1.default.hashPassword(newPassword);
        clientAccount.password = newHashedPassword;
        await clientAccount.save();
        return true;
    }
}
exports.authService = authService;
