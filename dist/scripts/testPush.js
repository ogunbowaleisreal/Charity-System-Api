"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const firebase_1 = require("../config/firebase");
async function testPush() {
    try {
        const res = await firebase_1.messaging.send({
            token: process.env.TEST_FCM_TOKEN,
            notification: {
                title: "Backend Test",
                body: "If this works, backend is fine",
            },
        });
        console.log("✅ SUCCESS:", res);
    }
    catch (error) {
        console.error("❌ ERROR:", error);
    }
}
testPush();
