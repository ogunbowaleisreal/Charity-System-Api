"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bcryptUtil = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class BcryptUtil {
    constructor() {
        this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
    }
    async hashPassword(password) {
        try {
            const salt = await bcryptjs_1.default.genSalt(this.saltRounds);
            return await bcryptjs_1.default.hash(password, salt);
        }
        catch (error) {
            throw new Error("Failed to hash password");
        }
    }
    // async comparePassword(password: string, hash: string): Promise<boolean> {
    //     try {
    //         return await bcrypt.compare(password, hash);
    //     } catch (error) {
    //         throw new Error("Failed to compare password");
    //     }
    // }
    async comparePassword(password, hash) {
        try {
            if (!password || !hash) {
                throw new Error("Missing password or hash in bcrypt compare");
            }
            return await bcryptjs_1.default.compare(password, hash);
        }
        catch (error) {
            console.error("bcrypt compare error:", error);
            throw error; // DO NOT hide it
        }
    }
    async isPasswordInHistory(newPassword, passwordHistory) {
        for (const hashedPassword of passwordHistory) {
            if (await this.comparePassword(newPassword, hashedPassword)) {
                return true;
            }
        }
        return false;
    }
    updatePasswordHistory(passwordHistory, newPasswordHash, maxHistory = 5) {
        const updatedHistory = [newPasswordHash, ...passwordHistory];
        return updatedHistory.slice(0, maxHistory);
    }
}
exports.bcryptUtil = new BcryptUtil();
exports.default = exports.bcryptUtil;
