import type { Notification } from "firebase-admin/messaging";
import { messaging } from "../config/firebase";
import { NotificationToken } from "../models/NotificationToken";
import { Account } from "../models/Accounts";

// FCM requires every value in `data` to be a string.
export type PushData = Record<string, string>;

export interface PushResult {
    success: boolean;
    successCount: number;
    failureCount: number;
    invalidTokensRemoved: number;
    error?: string;
}

const FCM_CHUNK_SIZE = 500; // hard limit imposed by FCM multicast

export class PushNotificationService {

    static async saveToken(
        userId: string,
        token: string,
        platform: "web" | "android" | "ios"
    ) {
        await NotificationToken.findOneAndUpdate(
            { token }, // unique identifier
            {
                userId,
                token,
                platform,
                lastUsedAt: new Date(),
            },
            {
                upsert: true,   // create if not exists
                new: true,      // return updated doc
                setDefaultsOnInsert: true,
            }
        );
    }

    // Subscribe to topic
    static async subscribeToTopic(token: string, topic: string) {
        await messaging.subscribeToTopic([token], topic);
    }

    // Send to topic (BEST for your use case)
    static async sendToTopic(topic: string, title: string, body: string): Promise<PushResult> {
        try {
            await messaging.send({
                topic,
                notification: { title, body },
                data: {
                    url: process.env.FRONTEND_URL ?? ""
                }
            });
            return { success: true, successCount: 1, failureCount: 0, invalidTokensRemoved: 0 };
        } catch (error) {
            console.error("Push notification error (sendToTopic):", error);
            return {
                success: false,
                successCount: 0,
                failureCount: 1,
                invalidTokensRemoved: 0,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    // Send to all verified users
    static async sendToUsers(notification: Notification, data?: PushData): Promise<PushResult> {
        const tokens = [...new Set(await this.getAllVerifiedUserTokens())];

        if (!tokens.length) {
            return { success: false, successCount: 0, failureCount: 0, invalidTokensRemoved: 0, error: "No tokens found" };
        }

        const failedTokens: string[] = [];
        let successCount = 0;
        let failureCount = 0;

        try {
            for (let i = 0; i < tokens.length; i += FCM_CHUNK_SIZE) {
                const chunk = tokens.slice(i, i + FCM_CHUNK_SIZE);

                const response = await messaging.sendEachForMulticast({
                    tokens: chunk,
                    notification,
                    data,
                });

                successCount += response.successCount;
                failureCount += response.failureCount;

                // cleanup invalid tokens
                response.responses.forEach((res, index) => {
                    if (!res.success) {
                        const errorCode = res.error?.code;
                        if (
                            errorCode === "messaging/registration-token-not-registered" ||
                            errorCode === "messaging/invalid-registration-token"
                        ) {
                            failedTokens.push(chunk[index]);
                        }
                    }
                });
            }

            if (failedTokens.length) {
                await NotificationToken.deleteMany({
                    token: { $in: failedTokens }
                });
            }

            return {
                success: failureCount === 0,
                successCount,
                failureCount,
                invalidTokensRemoved: failedTokens.length,
            };
        } catch (error) {
            console.error("Push notification error (sendToUsers):", error);
            return {
                success: false,
                successCount,
                failureCount,
                invalidTokensRemoved: failedTokens.length,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    // Send to a single user (across all of their registered devices)
    static async sendToUser(userId: string, notification: Notification, data?: PushData): Promise<PushResult> {
        const userTokens = await NotificationToken.find({ userId });

        if (!userTokens.length) {
            return { success: false, successCount: 0, failureCount: 0, invalidTokensRemoved: 0, error: "No tokens found for user" };
        }

        const tokens = [...new Set(userTokens.map(t => t.token))];
        const failedTokens: string[] = [];
        let successCount = 0;
        let failureCount = 0;

        try {
            // Chunk defensively in case a user ever accumulates >500 devices/tokens
            for (let i = 0; i < tokens.length; i += FCM_CHUNK_SIZE) {
                const chunk = tokens.slice(i, i + FCM_CHUNK_SIZE);

                const response = await messaging.sendEachForMulticast({
                    tokens: chunk,
                    notification,
                    data,
                });

                successCount += response.successCount;
                failureCount += response.failureCount;

                response.responses.forEach((res, index) => {
                    if (!res.success) {
                        const errorCode = res.error?.code;
                        if (
                            errorCode === "messaging/registration-token-not-registered" ||
                            errorCode === "messaging/invalid-registration-token"
                        ) {
                            failedTokens.push(chunk[index]);
                        }
                    }
                });
            }

            if (failedTokens.length) {
                await NotificationToken.deleteMany({
                    token: { $in: failedTokens }
                });
            }

            return {
                success: failureCount === 0,
                successCount,
                failureCount,
                invalidTokensRemoved: failedTokens.length,
            };
        } catch (error) {
            console.error("Push notification error (sendToUser):", error);
            return {
                success: false,
                successCount,
                failureCount,
                invalidTokensRemoved: failedTokens.length,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    static async getAllUserTokens() {
        const tokens = await NotificationToken.find();
        return tokens.map(t => t.token);
    }

    static async getAllVerifiedUserTokens() {
        const users = await Account.find({ isVerified: true }).lean();
        const userIds = users.map(u => u._id.toString());
        const tokens = await NotificationToken.find({ userId: { $in: userIds } });
        return tokens.map(t => t.token);
    }
}

