import { createClient } from "redis";
import "dotenv/config";

export const redisClient = createClient({
    url: process.env.REDIS_URL,
});

redisClient.on("connect", () => console.log("✅ Redis Connected"));
redisClient.on("error", (err) => console.error("❌ Redis Error:", err));

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

// New: disconnect Redis gracefully
export const disconnectRedis = async () => {
    if (redisClient.isOpen) {
        await redisClient.quit();
        console.log("Redis connection closed");
    }
};
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
