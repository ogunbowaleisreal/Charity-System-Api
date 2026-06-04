"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const firebase_1 = require("../../config/firebase");
const NotificationToken_1 = require("../../models/NotificationToken");
class NotificationService {
    // Save token
    static async saveToken(userId, token) {
        await NotificationToken_1.NotificationToken.findOneAndUpdate({ token }, { userId, token }, { upsert: true, new: true });
    }
    // Subscribe to topic
    static async subscribeToTopic(token, topic) {
        await firebase_1.messaging.subscribeToTopic([token], topic);
    }
    // Send to topic (BEST for your use case)
    static async sendToTopic(topic, title, body) {
        await firebase_1.messaging.send({
            topic,
            notification: { title, body },
            data: {
                url: process.env.FRONTEND_URL
            }
        });
    }
    // Send to specific users (optional)
    static async sendToUsers(userIds, payload) {
        const tokens = await NotificationToken_1.NotificationToken.find({
            userId: { $in: userIds },
        });
        const tokenList = tokens.map(t => t.token);
        if (!tokenList.length)
            return;
        const response = await firebase_1.messaging.sendEachForMulticast({
            tokens: tokenList,
            notification: payload,
        });
        // cleanup invalid tokens
        response.responses.forEach((res, index) => {
            if (!res.success) {
                const errorCode = res.error?.code;
                if (errorCode === "messaging/registration-token-not-registered") {
                    NotificationToken_1.NotificationToken.deleteOne({ token: tokenList[index] });
                }
            }
        });
    }
}
exports.NotificationService = NotificationService;
