import app from "./app";
import mongoose from "mongoose";
import connectDB from "./config/database";
import { connectRedis, disconnectRedis } from "./config/redis"; // add disconnect function
import { handleBiddingLifecycle } from "./cron/biddingCronJob";
import { closeExpiredAssignment } from "./cron/assignmentJob";
import http from "http";
import { start } from "repl";

require('dotenv').config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

async function startServer() {
    try {
        await connectDB();
        await connectRedis();

        handleBiddingLifecycle();
        closeExpiredAssignment();

        mongoose.connection.once('open', () => {
            console.log('Successfully connected to MongoDB');
        });

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
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

// import app from "./app"
// import mongoose from "mongoose"
// import connectDB from "./config/database"
// import { connectRedis } from "./config/redis"

// require('dotenv').config()
// const PORT = process.env.PORT || 3000
// try {
//     connectDB()
//     connectRedis()
//     mongoose.connection.once('open', (): void => {
//         console.log('successfully connected to mongoose ')
//         app.listen(PORT, () => {
//             console.log(`server running on port ${PORT}`)
//         })
//     })

// } catch (error) {
//     console.log("Error starting the database:", error)
// }

