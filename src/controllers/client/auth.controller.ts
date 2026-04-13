import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";
import { Account } from "../../models/Accounts";
import { authService } from "../../services/client/Auth.services";
import { OTPService } from "../../services/otp.services";
import bcryptUtil from "../../utils/bcryptutils";
import logger from "../../logger";
import axios from "axios";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";

const otpService = new OTPService();
const Authservice = new authService()
export class authController {

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            // Registration logic here
            //const { username, password, email } = req.body;
            const { firstName, lastName, password, email, phoneNumber, role, companyName, organizationType } = req.body
            if (!firstName || !lastName || !password || !email || !phoneNumber || !role) {
                return res.status(400).json({ message: "username, password and email are required" })
            }
            const user = await Account.findOne({ email })
            if (!user) {
                const hashedPassword = await bcryptUtil.hashPassword(password);
                const newUser = new Account({
                    firstName,
                    lastName,
                    role: role,
                    password: hashedPassword,
                    email,
                    phoneNumber,
                    //phoneCountryCode,
                    //gender,
                    //companyName,
                    //businessCategory,
                    isVerified: false
                });


                if (role == "organization") {
                    newUser.companyName = companyName
                    newUser.organizationType = organizationType
                }
                // newUser.gender = gender
                // newUser.status = "pending"
                await newUser.save()

                await otpService.generateAndSendOTP(email, "registration")
                return res.status(201).json({ message: "user registered successfully, check your email for verification" })
            }
            return res.status(403).json({ "message": "user with email already exists in database" })
        } catch (err) {
            //return res.status(500).json({ message: "Internal Server Error", error: err })
            logger.error("registration failed", err)
            next(err)
        }
    }

    async verify2FA(req: Request, res: Response) {
        try {
            const { email, otp } = req.body;
            const result = await Authservice.verify2FA(email, otp);

            sendSuccessResponse(res, result, "Login Successful");
        } catch (error: any) {
            logger.error("Verify 2fa OTP error:", error);
            sendErrorResponse(
                res,
                error.message || "Invalid OTP",
                error.statusCode || HTTP_STATUS.BAD_REQUEST
            );
        }
    };

    async verifyOtp(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, otp } = req.body
            console.log("got here ")
            const verified = await otpService.verifyOTP(email, otp, "registration")
            // if (!verified) {
            //     return res.status(403).json({ "message": "otp verification failed" })
            // }
            const registeredUser = await Account.findOne({ email })
            if (!registeredUser) {
                return res.status(404).json({ "message": "user not registered" })
            }
            registeredUser.isVerified = true
            await registeredUser.save()
            return res.status(200).json({ "message": "otp verification and registration completed" })
        } catch (err: any) {
            logger.error("verificaion failed", err)
            return next(err)
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const ip = req.ip as string
            console.log({ user_ip: ip })
            if (!email || !password) {
                return res.status(400).json({ message: "email and password are required" })
            }

            const user = await Account.findOne({ email }).select("-password");
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const response = await Authservice.login({ email, password })

            const normalizeIp = (ip: string) => {
                if (ip.startsWith("::ffff:")) {
                    return ip.replace("::ffff:", "");
                }
                return ip;
            };

            const cleanIp = normalizeIp(ip);

            if (
                cleanIp === "127.0.0.1" ||
                cleanIp === "::1" ||
                cleanIp.startsWith("192.168.") ||
                cleanIp.startsWith("10.")
            ) {
                console.log("Skipping geolocation for local/private IP");
            } else {
                // call ipapi
            }

            const location = await axios.get(`https://ipapi.co/${cleanIp}/json/`);
            console.log({ location: location.data })

            user.lastLogin = new Date()
            user.lastLoginIp = cleanIp
            user.lastLoginLocation = location.data
            await user.save()
            return res.status(200).json({ message: "Login successful", response });
        } catch (err) {
            // return res.status(500).json({ message: "Internal Server Error", error: err })
            //sendErrorResponse(res, "auth failed")
            return next(err)
        }
    }

    async logout(req: Request, res: Response) {
        try {
            const refreshToken = req.body.refreshToken;
            if (!refreshToken) {
                return res.status(400).json({ message: "No refresh token provided" });
            }
            const deleted = await Authservice.deleteRefreshToken(refreshToken);
            if (deleted) {
                res.clearCookie("refreshToken", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                });
                return res.status(200).json({ message: "Logout successful" });
            } else {
                return res.status(400).json({ message: "Invalid refresh token" });
            }
        } catch (err) {
            return res.status(500).json({ message: "Internal Server Error", error: err })
        }
    }

    async deleteAccount(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: "Email is required" });
            }
            const deleted = await Authservice.deleteAccount(email);
            if (deleted) {
                return res.status(200).json({ message: "Account deleted successfully" });
            } else {
                return res.status(400).json({ message: "Account not found" });
            }
        } catch (err) {
            return res.status(500).json({ message: "Internal Server Error", error: err })
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            //const refreshToken = req.cookies.refreshToken;
            const Token = req.body.refreshToken
            if (!Token) {
                return res.status(400).json({ message: "No refresh token provided" });
            }
            const { accessToken, refreshToken, expiresIn } = await Authservice.refreshToken(Token);
            // const { storedToken } = await authservice.verifyRefreshToken(refreshToken);
            // if (!storedToken) {
            //     return res.status(401).json({ message: "Invalid refresh token" });
            // }
            // const user = await Account.findById(storedToken.userId);
            // if (!user) {
            //     return res.status(404).json({ message: "User not found" });
            // }
            // const { accessToken, refreshToken: newRefreshToken } = await authservice.createUserSession({
            //     user_id: user._id as string,
            //     role: user.role
            // });
            // await authservice.deleteRefreshToken(refreshToken);

            // res.cookie("refreshToken", newRefreshToken, {
            //     httpOnly: true,
            //     secure: process.env.NODE_ENV === "production",
            //     sameSite: "strict",
            //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days  
            // });
            return res.status(200).json({ accessToken, refreshToken, expiresIn });
        } catch (err) {
            logger.error("refresh failed", err)
            next(err)
            return res.status(500).json({ message: "Internal Server Error", error: err })
        }
    }

    async PasswordResetOtp(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: "Email is required" });
            }
            await otpService.generateAndSendOTP(email, "password_reset");
            return res.status(200).json({ message: "OTP sent to email" });
        } catch (err) {
            logger.error("otp request failed")
            next(err)
        }
    }

    async resendOtp(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: "Email is required" });
            }
            await otpService.generateAndSendOTP(email, "registration");
            return res.status(200).json({ message: "OTP resent to email" });
        } catch (err) {
            logger.error("otp request failed")
            next(err)
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, otp, newPassword } = req.body;
            if (!email || !otp || !newPassword) {
                return res.status(400).json({ message: "Email, OTP and new password are required" });
            }

            const response = await Authservice.resetPassword(email, otp, newPassword);
            if (!response) {
                throw new Error("Password reset failed")
            }
            logger.info("password reset successful",)
            return res.status(200).json({ message: "Password reset successful" });
        } catch (err: any) {
            logger.error("password reset error", err)
            sendErrorResponse(res, err.message, err.statusCode)
            next(err)
            //return res.status(500).json({ message: "Internal Server Error", error: err })
        }
    }
}

