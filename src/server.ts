
// Must be the first import — loads .env before any other module (including
// app.ts and its dependencies) has a chance to read process.env at load time.
import "./instrument";
import "dotenv/config";

import http from "http";
import mongoose from "mongoose";
import app from "./app";
import connectDB from "./config/database";
import { connectRedis, disconnectRedis } from "./config/redis";
// Side-effect import: registers the transaction-status cron job on load.
import "./cron/updateTransactionStatus";
import { startAnnouncementCron } from "./cron/announcementCron";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

async function startServer() {
    try {
        await connectDB();
        console.log('Successfully connected to MongoDB');

        await connectRedis();

        startAnnouncementCron();

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            const mem = process.memoryUsage();
            console.log(`RSS: ${(mem.rss / 1024 / 1024).toFixed(1)} MB`);
            console.log(`Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`);
            console.log(`Modules loaded: ${Object.keys(require.cache).length}`);
        });
    } catch (error) {
        console.error("Error starting the server:", error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);

    // Stop accepting new connections
    server.close(async (err) => {
        if (err) {
            console.error("Error closing server:", err);
            process.exit(1);
        }

        try {
            // Close DB connections
            await mongoose.connection.close();
            console.log("MongoDB connection closed");

            // Close Redis connection
            await disconnectRedis();
            console.log("Redis connection closed");

            process.exit(0);
        } catch (shutdownError) {
            console.error("Error during shutdown:", shutdownError);
            process.exit(1);
        }
    });
};

// Listen for termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

