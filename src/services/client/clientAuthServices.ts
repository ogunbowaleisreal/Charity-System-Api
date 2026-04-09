// // import Account, { IAccountData, User, Vendor } from "@/models/Account";
// import { RefreshToken } from "@/models/RefreshToken";
// import { jwtUtil } from "@/utils/jwt";
// import { IClient } from "@/models/Client";
// import { bcryptUtil } from "@/utils/bcrypt";
// import EmailService from "../emailService";
// import OTPService from "@/services/otpService";
// import { CacheService } from "@/utils/cache";
// import { HTTP_STATUS, ERROR_CODES } from "@/utils/constants";
// import Client from "@/models/Client";
// import {
//   RegisterRequest,
//   LoginRequest,
//   AuthResponse,
//   InitiateListingCreationRequest,
// } from "@/types/auth";
// import logger from "@/logger";
// import { IAccount } from "@/types/account";
// import { sendErrorResponse, sendSuccessResponse } from "@/utils/helpers";
// // import { IListing, Listing } from "@/models/Listing";

// export class AuthService {
//   private emailService = new EmailService();
//   private otpService = new OTPService();

//   async register(data: RegisterRequest): Promise<{ email: string }> {
//     const { email, password, firstName, lastName, companyName, phone } = data;

//     const [existingUser, hashedPassword] = await Promise.all([
//       Account.findByEmail(email),
//       bcryptUtil.hashPassword(password),
//     ]);

//     if (existingUser) {
//       if (existingUser.isVerified) {
//         throw {
//           message: "User already exists with this email",
//           statusCode: HTTP_STATUS.CONFLICT,
//         };
//       } else {
//         // Resend OTP without blocking response
//         // this.otpService
//         //   .generateAndSendOTP(email, "registration")
//         //   .catch((err) => logger.error("Failed to resend OTP:", err));

//         throw {
//           message:
//             "Account exists but not verified. New verification code sent.",
//           statusCode: HTTP_STATUS.CONFLICT,
//           action: "verification_resent",
//         };
//       }
//     }
//     const client = await Client.create({
//       firstName,
//       lastName,
//       email,
//       password: hashedPassword,
//       companyName,
//       status: "lead",
//       phone,
//       role: "client",
//     }); // Create empty client profile

//     // const user = new Account({
//     //   firstName,
//     //   lastName,
//     //   email,
//     //   password: hashedPassword,
//     //   role: role,
//     // });

//     // Save user first, send email in background
//     //const savedUser = await user.save();

//     // Don't wait for email - fire and forget with error handling
//     this.otpService.generateAndSendOTP(email, "registration").catch((err) => {
//       logger.error("Failed to send registration OTP:", {
//         userId: client._id,
//         email,
//         error: err,
//       });
//       // Could implement retry logic here
//     });

//     logger.info("User created:", { userId: client._id, email });
//     return { email };
//   }

//   async updateVendor(
//     data: InitiateListingCreationRequest,
//     userId: string
//   ): Promise<IListing | null> {
//     const user = await Account.findById(userId);

//     console.log("called", userId)

//     if (!user) {
//       throw {
//         message: "User not found",
//       };
//     }

//     if (user.role !== "vendor") {
//       throw {
//         message: "Only vendors can create listings",
//         statusCode: HTTP_STATUS.FORBIDDEN,
//       };
//     }

//     const ifListingExists = await Listing.findOne({ vendorId: userId });
//     if (ifListingExists) {
//       throw {
//         message: "Vendor listing already exists",
//         statusCode: HTTP_STATUS.CONFLICT,
//       };
//     }

//     const draft = new Listing({
//       vendorId: userId,
//       businessInfo: { ...data },
//     });

//     return await draft.save();
//   }

//   async verifyOTP(data: { email: string; otp: string }): Promise<AuthResponse> {
//     const { email, otp } = data;
//     const client = await Client.findOne({ email });
//     if (!client) {
//       throw { message: "User not found", statusCode: HTTP_STATUS.NOT_FOUND };
//     }

//     // Find user
//     // const user = await Account.findByEmail(email);
//     // if (!user) {
//     //   throw { message: "User not found", statusCode: HTTP_STATUS.NOT_FOUND };
//     // }

//     // Verify OTP
//     await this.otpService.verifyOTP(email, otp, "registration");

//     // Activate user
//     //user.isVerified = true;
//     //await user.save();

//     await this.emailService.sendWelcomeEmail(email, client.firstName, client.role);

//     // Generate tokens
//     const tokens = jwtUtil.generateTokenPair({
//       userId: client._id.toString(),
//       email: client.email,
//       role: client.role,
//     });

//     // Save refresh token
//     await this.saveRefreshToken(
//       tokens.tokenId,
//       client._id.toString(),
//       "user",
//       tokens.refreshToken
//     );

//     return this.formatLoginResponse(client, tokens);
//   }

//   async verifyFPOTP(data: { email: string; otp: string }) {
//     const { email, otp } = data;

//     // Find user
//     const client = await Client.findOne({ email });
//     if (!client) {
//       throw { message: "User not found", statusCode: HTTP_STATUS.NOT_FOUND };
//     }
//     // const user = await Account.findByEmail(email);
//     // if (!user) {
//     //   throw { message: "User not found", statusCode: HTTP_STATUS.NOT_FOUND };
//     // }

//     // Verify OTP
//     await this.otpService.verifyOTP(email, otp, "password_reset");
//     const resetToken = await jwtUtil.generateResetToken(email);

//     return {
//       resetToken,
//     };
//   }

//   async verify2FA(email: string, otp: string) {
//     const client = await Client.findOne({ email });
//     if (!client) {
//       throw { message: "User not found", statusCode: HTTP_STATUS.NOT_FOUND };
//     }
//     // const user = await Account.findByEmail(email);
//     // if (!user) {
//     //   throw { message: "User not found", statusCode: HTTP_STATUS.NOT_FOUND };
//     // }

//     await this.otpService.verifyOTP(email, otp, "2fa");

//     const tokens = jwtUtil.generateTokenPair({
//       userId: client._id.toString(),
//       email: client.email,
//       role: client.role,
//     });

//     await this.saveRefreshToken(
//       tokens.tokenId,
//       client._id.toString(),
//       "user",
//       tokens.refreshToken
//     );

//     return this.formatLoginResponse(client, tokens);
//   }

//   async login(
//     data: LoginRequest,
//     ip?: string,
//     userAgent?: string
//   ): Promise<AuthResponse> {
//     const { email, password } = data;

//     // Find user
//     const client = await Client.findOne({ email });
//     if (!client) {
//       throw { message: "Invalid credentials", statusCode: HTTP_STATUS.UNAUTHORIZED };
//     }
//     //const user = await Account.findByEmail(email).select("+password");

//     //     if (!user) {
//     //       throw {
//     //         message: "Invalid credentials",
//     //         statusCode: HTTP_STATUS.UNAUTHORIZED,
//     //       };
//     //     }

//     // check is account is verified
//     // if (!user.isVerified) {
//     //   this.otpService.generateAndSendOTP(email, "registration");
//     //   throw {
//     //     success: true,
//     //     message:
//     //       "Just one more step! We've sent a verification code to your email. Please check your inbox and enter the code to complete your login.",
//     //     statusCode: HTTP_STATUS.LOCKED,
//     //   };
//     // }

//     // if (user.status === "suspended") {
//     //   throw {
//     //     message:
//     //       "Your account has been suspended by the administrator due to a violation of our policies. Please contact support for further assistance.",
//     //     statusCode: HTTP_STATUS.FORBIDDEN,
//     //   };
//     // }

//     // // Check if account is locked
//     // if (user.checkAccountLock()) {
//     //   throw { message: "Account is locked", statusCode: HTTP_STATUS.LOCKED };
//     // }

//     // Verify password
//     // const isPasswordValid = await user.comparePassword(password);
//     // if (!isPasswordValid) {
//     //   await user.incrementLoginAttempts();
//     //   throw {
//     //     message: "Invalid credentials",
//     //     statusCode: HTTP_STATUS.UNAUTHORIZED,
//     //   };
//     // }

//     // // Reset login attempts and update last login
//     // await user.resetLoginAttempts();
//     // user.lastLogin = new Date();
//     // await user.save();

//     // if (user.twoFactorEnabled) {
//     //   this.otpService.generateAndSendOTP(email, "2fa");

//     //   throw {
//     //     message:
//     //       "Just one more step! We've sent a verification code to your email. Please check your inbox and enter the code to complete your login.",
//     //     success: true,
//     //     statusCode: HTTP_STATUS.FORBIDDEN,
//     //   };
//     // }
//     // compmare password for client
//     const isPasswordValid = await bcryptUtil.comparePassword(
//       password, client.password
//     );
//     if (!isPasswordValid) {
//       throw { message: "Invalid credentials", statusCode: HTTP_STATUS.UNAUTHORIZED };
//     }

//     // // Generate tokens
//     const tokens = jwtUtil.generateTokenPair({
//       userId: client._id.toString(),
//       email: client.email,
//       role: client.role,
//     });

//     // Save refresh token
//     await this.saveRefreshToken(
//       tokens.tokenId,
//       client._id.toString(),
//       "user",
//       tokens.refreshToken,
//       ip,
//       userAgent
//     );

//     return this.formatLoginResponse(client, tokens);
//   }

//   async logout(authHeader?: string): Promise<void> {
//     if (!authHeader) return;

//     const token = jwtUtil.extractTokenFromHeader(authHeader);
//     if (token) {
//       const decoded = jwtUtil.decodeToken(token);
//       if (decoded?.jti) {
//         await CacheService.blacklistToken(decoded.jti);
//       }
//     }
//   }

//   async logoutAll(authHeader?: string): Promise<void> {
//     if (!authHeader) return;

//     const token = jwtUtil.extractTokenFromHeader(authHeader);
//     if (token) {
//       const decoded = jwtUtil.decodeToken(token);
//       if (decoded?.userId) {
//         await RefreshToken.deactivateAllUserTokens(decoded.userId, "user");
//       }
//     }
//   }

//   async refreshToken(
//     refreshToken: string
//   ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
//     // Verify refresh token
//     const decoded = jwtUtil.verifyRefreshToken(refreshToken);
//     console.log(decoded)
//     // Find refresh token in database
//     const tokenDoc = await RefreshToken.findActiveToken(decoded.tokenId);
//     if (!tokenDoc) {
//       throw {
//         message: "Invalid refresh token",
//         statusCode: HTTP_STATUS.UNAUTHORIZED,
//       };
//     }

//     // Find user
//     const client = await Client.findById(decoded.userId);
//     if (!client) {
//       throw { message: "User not found or inactive", statusCode: HTTP_STATUS.UNAUTHORIZED };
//     }
//     //const user = await Account.findById(decoded.userId);
//     // if (!user || user.status !== "active") {
//     //   throw {
//     //     message: "User not found or inactive",
//     //     statusCode: HTTP_STATUS.UNAUTHORIZED,
//     //   };
//     // }

//     // Deactivate old token
//     await tokenDoc.deactivate();

//     // Generate new tokens
//     const tokens = jwtUtil.generateTokenPair({
//       userId: client._id.toString(),
//       email: client.email,
//       role: client.role,
//     });

//     // Save new refresh token
//     await this.saveRefreshToken(
//       tokens.tokenId,
//       client._id.toString(),
//       "user",
//       tokens.refreshToken
//     );

//     return {
//       accessToken: tokens.accessToken,
//       refreshToken: tokens.refreshToken,
//       expiresIn: tokens.expiresIn,
//     };
//   }

//   async forgotPassword(email: string): Promise<void> {
//     const user = await Account.findByEmail(email);
//     if (!user) {
//       // Don't reveal if email exists
//       return;
//     }

//     await this.otpService.generateAndSendOTP(email, "password_reset");
//   }

//   async resetPassword(data: {
//     resetToken: string;
//     newPassword: string;
//   }): Promise<void> {
//     const { resetToken, newPassword } = data;

//     const isResetTokenBlacklisted = await CacheService.isResetTokenBlacklisted(
//       resetToken
//     );
//     if (isResetTokenBlacklisted) {
//       throw new Error(
//         "Your reset link has expired. Please request a new OTP to continue."
//       );
//     }

//     const decoded = jwtUtil.verifyResetToken(resetToken);

//     const user = await Account.findByEmail(decoded.email).select(
//       "+password +passwordHistory"
//     );
//     await CacheService.blacklistResetToken(resetToken);
//     if (!user) {
//       throw { message: "User not found", statusCode: HTTP_STATUS.NOT_FOUND };
//     }

//     // Check password history
//     if (
//       await bcryptUtil.isPasswordInHistory(newPassword, user.passwordHistory)
//     ) {
//       throw {
//         message: "Cannot reuse recent passwords",
//         statusCode: HTTP_STATUS.BAD_REQUEST,
//       };
//     }

//     // Update password
//     const hashedPassword = await bcryptUtil.hashPassword(newPassword);
//     user.password = hashedPassword;
//     user.passwordHistory = bcryptUtil.updatePasswordHistory(
//       user.passwordHistory,
//       hashedPassword
//     );
//     await user.save();

//     // Invalidate all refresh tokens
//     await RefreshToken.deactivateAllUserTokens(user._id.toString(), "user");
//   }

//   async handleGoogleAuth(googleUser: any): Promise<AuthResponse> {
//     // Generate tokens for Google authenticated user
//     const tokens = jwtUtil.generateTokenPair({
//       userId: googleUser._id.toString(),
//       email: googleUser.email,
//       role: googleUser.role,
//     });

//     // Save refresh token
//     await this.saveRefreshToken(
//       tokens.tokenId,
//       googleUser._id.toString(),
//       googleUser.role,
//       tokens.refreshToken
//     );

//     //todo spread the data for vendor since all data can show
//     //refactoring too
//     if (googleUser.role === "vendor") {
//       return {
//         message: "Google authentication successful",
//         user: {
//           id: googleUser._id.toString(),
//           email: googleUser.email,
//           firstName: googleUser.firstName,
//           lastName: googleUser.lastName,
//           role: googleUser.role || "user",
//           status: googleUser.status,
//           twoFactorEnabled: googleUser.twoFactorEnabled,
//           isVerified: googleUser.isVerified,
//           businessName: googleUser.businessName,
//           businessPhone: googleUser.businessPhone,
//           businessCategory: googleUser.businessCategory,
//           businessAddress: googleUser.businessAddress,

//           profilePicture: googleUser.profilePicture,
//           totalViews: googleUser.totalViews,
//           totalListings: googleUser.totalListings,
//           averageRating: googleUser.averageRating,
//           totalReviews: googleUser.totalReviews,
//           subscriptionPlan: googleUser.subscriptionPlan,
//           subscriptionStartDate: googleUser.subscriptionStartDate,
//           subscriptionEndDate: googleUser.subscriptionEndDate,

//           orderNotifications: googleUser.orderNotifications,
//           createdAt: googleUser.createdAt,
//           updatedAt: googleUser.updatedAt,
//         },
//         tokens: {
//           accessToken: tokens.accessToken,
//           refreshToken: tokens.refreshToken,
//           expiresIn: tokens.expiresIn,
//         },
//       };
//     }
//     return {
//       message: "Google authentication successful",
//       user: {
//         id: googleUser._id.toString(),
//         email: googleUser.email,
//         firstName: googleUser.firstName,
//         profilePicture: googleUser.profilePicture,
//         lastName: googleUser.lastName,
//         role: googleUser.role || "user",
//         isVerified: googleUser.isVerified,
//         twoFactorEnabled: googleUser.twoFactorEnabled,
//       },
//       tokens: {
//         accessToken: tokens.accessToken,
//         refreshToken: tokens.refreshToken,
//         expiresIn: tokens.expiresIn,
//       },
//     };
//   }

//   async resendOTP(email: string): Promise<void> {
//     const user = await Account.findByEmail(email);
//     if (!user || user.isVerified) {
//       return;
//     }

//     await this.otpService.generateAndSendOTP(email, "registration");
//   }

//   private async saveRefreshToken(
//     tokenId: string,
//     userId: string,
//     userType: string,
//     token: string,
//     ip?: string,
//     userAgent?: string
//   ): Promise<void> {
//     const refreshToken = new RefreshToken({
//       tokenId,
//       userId,
//       userType,
//       token,
//       ipAddress: ip,
//       userAgent,
//       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
//     });

//     await refreshToken.save();
//     await CacheService.setRefreshToken(tokenId, { userId, userType });
//   }

//   private formatLoginResponse = async (
//     user: IClient,
//     tokens: {
//       accessToken: string;
//       refreshToken: string;
//       expiresIn: number;
//     }
//   ): Promise<AuthResponse> => {
//     if (user.role === "vendor") {
//       return {
//         // message: "Account verified successfully",
//         user: {
//           id: user._id.toString(),
//           firstName: user.firstName,
//           lastName: user.lastName,
//           email: user.email,
//           role: user.role,
//           status: user.status,
//           // isVerified: user.isVerified,
//           // profilePicture: user.profilePicture,
//           // phone: user.phone,
//           // businessName: user.businessName,
//           // businessCategory: user.businessCategory,
//           // businessPhone: user.businessPhone,
//           // businessAddress: user.businessAddress,
//           // location: user.location,
//           // totalViews: user.totalViews,
//           // totalListings: user.totalListings,
//           // averageRating: user.averageRating,
//           // totalReviews: user.totalReviews,
//           // subscriptionPlan: user.subscriptionPlan,
//           // subscriptionStartDate: user.subscriptionStartDate,
//           // subscriptionEndDate: user.subscriptionEndDate,
//           // orderNotifications: user.orderNotifications,
//           // twoFactorEnabled: user.twoFactorEnabled,
//           //createdAt: user.createdAt,
//           //updatedAt: user.updatedAt,
//         } as any,
//         tokens,
//       };
//     }

//     return {
//       // message: "Account verified successfully",
//       user: {
//         id: user._id.toString(),
//         email: user.email,
//         firstName: user.firstName,
//         phone: user.phone,
//         //profilePicture: user.profilePicture,
//         lastName: user.lastName,
//         role: user.role,
//         //isVerified: user.isVerified,
//         //twoFactorEnabled: user.twoFactorEnabled,
//       },
//       tokens,
//     };
//   };
// }
