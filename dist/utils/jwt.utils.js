"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const hash_utils_1 = require("./hash.utils");
const signAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};
exports.signAccessToken = signAccessToken;
const signRefreshToken = () => {
    const plainRefreshToken = (0, hash_utils_1.randomString)(64);
    const hashedRefreshToken = (0, hash_utils_1.hashToken)(plainRefreshToken);
    return { plainRefreshToken: plainRefreshToken, hashedRefreshToken: hashedRefreshToken };
};
exports.signRefreshToken = signRefreshToken;
const verifyAccessToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (typeof decoded === 'object') {
            return decoded;
        }
        return null;
    }
    catch (err) {
        return null;
    }
};
exports.verifyAccessToken = verifyAccessToken;
