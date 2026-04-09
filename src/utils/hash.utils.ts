import crypto from "crypto";
import 'dotenv/config';
import bcrypt from "bcryptjs";

export const hashToken = (token: string): string =>
    crypto.createHash("sha256").update(token).digest("hex");

export const randomString = (size = 48): string =>
    crypto.randomBytes(size).toString("hex");

export const hashPassword = async (password: string): Promise<string> => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
}

export const generateOTP = (length = 6): string => {
    return crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
}

export const hashOTP = (otp: string): string => {
    return crypto.createHash("sha256").update(otp).digest("hex");
}