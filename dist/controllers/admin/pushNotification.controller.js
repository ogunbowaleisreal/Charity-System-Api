"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationController = void 0;
const pushNotificationService_1 = require("../../services/pushNotificationService");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
//const notificationService = new PushNotificationService();
class PushNotificationController {
    async sendToTopic(req, res) {
        try {
            const { topic, title, body } = req.body;
            await pushNotificationService_1.PushNotificationService.sendToTopic(topic, title, body);
            (0, helpers_1.sendSuccessResponse)(res, "Notification sent to topic");
        }
        catch (error) {
            logger_1.default.error(error.message);
            (0, helpers_1.sendErrorResponse)(res, error.message, 400);
        }
    }
    async sendToUsers(req, res) {
        try {
            const { title, body } = req.body;
            // if(type === "all") {
            await pushNotificationService_1.PushNotificationService.sendToUsers({ title, body });
            // }
            // await PushNotificationService.sendToUser({ title, body });
            (0, helpers_1.sendSuccessResponse)(res, "Notification sent to user");
        }
        catch (error) {
            logger_1.default.error(error.message);
            (0, helpers_1.sendErrorResponse)(res, error.message, 400);
        }
    }
}
exports.PushNotificationController = PushNotificationController;
