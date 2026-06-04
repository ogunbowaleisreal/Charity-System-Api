"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashOTP = exports.generateOTP = exports.comparePassword = exports.hashPassword = exports.randomString = exports.hashToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
require("dotenv/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const hashToken = (token) => crypto_1.default.createHash("sha256").update(token).digest("hex");
exports.hashToken = hashToken;
const randomString = (size = 48) => crypto_1.default.randomBytes(size).toString("hex");
exports.randomString = randomString;
const hashPassword = async (password) => {
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    return hashedPassword;
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hashedPassword) => {
    return await bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
const generateOTP = (length = 6) => {
    return crypto_1.default.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
};
exports.generateOTP = generateOTP;
const hashOTP = (otp) => {
    return crypto_1.default.createHash("sha256").update(otp).digest("hex");
};
exports.hashOTP = hashOTP;
