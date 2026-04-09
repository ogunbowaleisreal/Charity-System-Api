import dotenv from "dotenv"
dotenv.config()
import { messaging } from "../config/firebase";


async function testPush() {
    try {
        const res = await messaging.send({
            token: process.env.TEST_FCM_TOKEN as string,
            notification: {
                title: "Backend Test",
                body: "If this works, backend is fine",
            },
        });

        console.log("✅ SUCCESS:", res);
    } catch (error) {
        console.error("❌ ERROR:", error);
    }
}

testPush();