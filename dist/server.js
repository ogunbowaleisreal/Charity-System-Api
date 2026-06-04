"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = __importDefault(require("./config/database"));
const redis_1 = require("./config/redis"); // add disconnect function
const http_1 = __importDefault(require("http"));
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const server = http_1.default.createServer(app_1.default);
async function startServer() {
    try {
        await (0, database_1.default)();
        await (0, redis_1.connectRedis)();
        mongoose_1.default.connection.once('open', () => {
            console.log('Successfully connected to MongoDB');
        });
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Error starting the server:", error);
        process.exit(1);
    }
}
startServer();
// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    // Stop accepting new connections
    server.close(async (err) => {
        if (err) {
            console.error("Error closing server:", err);
            process.exit(1);
        }
        try {
            // Close DB connections
            await mongoose_1.default.connection.close();
            console.log("MongoDB connection closed");
            // Close Redis connection
            await (0, redis_1.disconnectRedis)();
            console.log("Redis connection closed");
            process.exit(0);
        }
        catch (shutdownError) {
            console.error("Error during shutdown:", shutdownError);
            process.exit(1);
        }
    });
};
// Listen for termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
