import { url } from "inspector";
import { messaging } from "../../config/firebase";
import { NotificationToken } from "../../models/NotificationToken";

export class NotificationService {

    // Save token
    static async saveToken(userId: string, token: string) {
        await NotificationToken.findOneAndUpdate(
            { token },
            { userId, token },
            { upsert: true, new: true }
        );
    }

    // Subscribe to topic
    static async subscribeToTopic(token: string, topic: string) {
        await messaging.subscribeToTopic([token], topic);
    }

    // Send to topic (BEST for your use case)
    static async sendToTopic(topic: string, title: string, body: string) {
        await messaging.send({
            topic,
            notification: { title, body },
            data: {
                url: process.env.FRONTEND_URL as string
            }
        });
    }

    // Send to specific users (optional)
    static async sendToUsers(userIds: string[], payload: any) {
        const tokens = await NotificationToken.find({
            userId: { $in: userIds },
        });

        const tokenList = tokens.map(t => t.token);

        if (!tokenList.length) return;

        const response = await messaging.sendEachForMulticast({
            tokens: tokenList,
            notification: payload,
        });

        // cleanup invalid tokens
        response.responses.forEach((res, index) => {
            if (!res.success) {
                const errorCode = res.error?.code;
                if (errorCode === "messaging/registration-token-not-registered") {
                    NotificationToken.deleteOne({ token: tokenList[index] });
                }
            }
        });
    }
}