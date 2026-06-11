// import mongoose from "mongoose";
// import { MongoMemoryServer } from "mongodb-memory-server";


// let mongoServer: MongoMemoryServer;

// beforeAll(async () => {
//     mongoServer = await MongoMemoryServer.create();
//     const uri = mongoServer.getUri();

//     await mongoose.connect(uri);
// });

// afterEach(async () => {
//     const collections = mongoose.connection.collections;

//     for (const key in collections) {
//         await collections[key].deleteMany({});
//     }
// });

// afterAll(async () => {
//     await mongoose.connection.dropDatabase();
//     await mongoose.connection.close();
//     await mongoServer.stop();
// });
// // import mongoose from "mongoose";
// // import dotenv from "dotenv";


// // dotenv.config();

// // // Increase timeout for DB + async operations
// // jest.setTimeout(30000);

// // /**
// //  * Connect to TEST database before all tests
// //  */
// // beforeAll(async () => {
// //     const MONGO_URI = process.env.MONGO_TEST_URI;

// //     if (!MONGO_URI) {
// //         throw new Error("MONGO_TEST_URI is not defined");
// //     }

// //     await mongoose.connect(MONGO_URI);

// //     console.log("🧪 Connected to TEST database");
// // });

// // /**
// //  * Clean database after each test
// //  */
// // afterEach(async () => {
// //     const collections = mongoose.connection.collections;

// //     for (const key in collections) {
// //         await collections[key].deleteMany({});
// //     }
// // });

// // /**
// //  * Disconnect after all tests finish
// //  */
// // afterAll(async () => {
// //     await mongoose.connection.close();
// //     console.log("🧪 Disconnected from TEST database");
// // });