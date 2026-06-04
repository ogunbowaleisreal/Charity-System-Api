"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectRedis = exports.connectRedis = exports.redisClient = void 0;
const redis_1 = require("redis");
require("dotenv/config");
exports.redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL,
});
exports.redisClient.on("connect", () => console.log("✅ Redis Connected"));
exports.redisClient.on("error", (err) => console.error("❌ Redis Error:", err));
const connectRedis = async () => {
    if (!exports.redisClient.isOpen) {
        await exports.redisClient.connect();
    }
};
exports.connectRedis = connectRedis;
// New: disconnect Redis gracefully
const disconnectRedis = async () => {
    if (exports.redisClient.isOpen) {
        await exports.redisClient.quit();
        console.log("Redis connection closed");
    }
};
exports.disconnectRedis = disconnectRedis;
// import { createClient } from "redis";
// import "dotenv/config";
// export const redisClient = createClient({
//     url: process.env.REDIS_URL,
// });
// redisClient.on("connect", () => console.log("✅ Redis Connected"));
// redisClient.on("error", (err) => console.error("❌ Redis Error:", err));
// export const connectRedis = async () => {
//     await redisClient.connect();
// };
