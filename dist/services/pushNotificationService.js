"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationService = void 0;
const firebase_1 = require("../config/firebase");
const NotificationToken_1 = require("../models/NotificationToken");
const Accounts_1 = require("../models/Accounts");
class PushNotificationService {
    // Save token
    // static async saveToken(userId: string, token: string) {
    //     await NotificationToken.findOneAndUpdate(
    //         { token },
    //         { userId, token },
    //         { upsert: true, new: true }
    //     );
    // }
    static async saveToken(userId, token, platform) {
        await NotificationToken_1.NotificationToken.findOneAndUpdate({ token }, // unique identifier
        {
            userId,
            token,
            platform,
            lastUsedAt: new Date(),
        }, {
            upsert: true, // create if not exists
            new: true, // return updated doc
            setDefaultsOnInsert: true,
        });
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
    static async sendToUsers(payload) {
        const tokens = await this.getAllVerifiedUserTokens();
        //    const tokenList = tokens.map(t => t.token);
        if (!tokens.length)
            throw new Error("No tokens found");
        const response = await firebase_1.messaging.sendEachForMulticast({
            tokens: tokens,
            notification: payload,
        });
        // cleanup invalid tokens
        response.responses.forEach((res, index) => {
            if (!res.success) {
                const errorCode = res.error?.code;
                if (errorCode === "messaging/registration-token-not-registered") {
                    NotificationToken_1.NotificationToken.deleteOne({ token: tokens[index] });
                }
            }
        });
    }
    // send to single User 
    static async sendToUser(userId, payload) {
        const userTokens = await NotificationToken_1.NotificationToken.find({ userId });
        if (!userTokens.length)
            return;
        const tokens = [...new Set(userTokens.map(t => t.token))];
        try {
            const response = await firebase_1.messaging.sendEachForMulticast({
                tokens,
                notification: payload,
            });
            // Handle failures
            const failedTokens = [];
            response.responses.forEach((res, index) => {
                if (!res.success) {
                    const errorCode = res.error?.code;
                    if (errorCode === "messaging/registration-token-not-registered") {
                        failedTokens.push(tokens[index]);
                    }
                }
            });
            // Remove invalid tokens
            if (failedTokens.length) {
                await NotificationToken_1.NotificationToken.deleteMany({
                    token: { $in: failedTokens }
                });
            }
        }
        catch (error) {
            console.error("Push notification error:", error);
        }
    }
    // static async sendToUser(userId: string, payload: any) {
    //     const token = await NotificationToken.findOne({ userId });
    //     if (!token) return;
    //     const response = await messaging.send({
    //         token: token.token,
    //         notification: payload,
    //     });
    //     if (!response.success) {
    //         const errorCode = response.error?.code;
    //         if (errorCode === "messaging/registration-token-not-registered") {
    //             NotificationToken.deleteOne({ token: token.token });
    //         }
    //     }
    // }
    static async getAllUserTokens() {
        const tokens = await NotificationToken_1.NotificationToken.find();
        return tokens.map(t => t.token);
    }
    static async getAllVerifiedUserTokens() {
        const users = await Accounts_1.Account.find({ isVerified: true }).lean();
        const userIds = users.map(u => u._id.toString());
        const tokens = await NotificationToken_1.NotificationToken.find({ userId: { $in: userIds } });
        return tokens.map(t => t.token);
    }
}
exports.PushNotificationService = PushNotificationService;
