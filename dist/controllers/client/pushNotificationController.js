"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const pushNotificationService_1 = require("../../services/pushNotificationService");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const Accounts_1 = require("../../models/Accounts");
class Notification {
    static async registerToken(req, res) {
        try {
            const userId = req.user?.userId; // assuming auth middleware
            const { token, platform } = req.body;
            const account = await Accounts_1.Account.findById(userId);
            if (!account)
                throw new Error("Account not found");
            // if (account.role === "user") throw new Error("Unauthorized client account");
            await pushNotificationService_1.PushNotificationService.saveToken(userId, token, platform);
            logger_1.default.info("Token registered");
            // auto subscribe to jobs topic
            await pushNotificationService_1.PushNotificationService.subscribeToTopic(token, "General");
            (0, helpers_1.sendSuccessResponse)(res, "Token registered");
        }
        catch (error) {
            logger_1.default.error(error.message);
            (0, helpers_1.sendErrorResponse)(res, error.message, 400);
        }
        //       res.status(200).json({ message: "Token registered" });
    }
}
exports.Notification = Notification;
