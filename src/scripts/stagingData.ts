// // import { MongoClient } from "mongodb";
// // import dotenv from "dotenv";
// // dotenv.config();


// // const uri = process.env.ATLAS_DATABASE_URI as string;
// // const client = new MongoClient(uri);

// // async function moveData() {
// //     try {
// //         await client.connect();

// //         const sourceDB = client.db("Floatthr");
// //         const destDB = client.db("Floatthr-staging");

// //         // Get all collections in sourceDB
// //         const collections = await sourceDB.listCollections().toArray();

// //         for (let col of collections) {
// //             const sourceCol = sourceDB.collection(col.name);
// //             const destCol = destDB.collection(col.name);

// //             // Copy all documents
// //             const docs = await sourceCol.find().toArray();
// //             if (docs.length > 0) {
// //                 await destCol.insertMany(docs);
// //             }
// //         }

// //         console.log("Data moved successfully");
// //     } finally {
// //         await client.close();
// //     }
// // }

// // moveData();
// import mongoose from "mongoose";
// import { Account } from "../models/Accounts"; // adjust path
// import ConsultantProfile from "../models/ConsultantProfile"; // adjust path
// import dotenv from "dotenv"

// dotenv.config();

// // -----------------------
// // Connect to MongoDB
// // -----------------------
// const MONGO_URI = process.env.ATLAS_DATABASE_URI as string; // replace with your URI

// async function main() {
//     await mongoose.connect(MONGO_URI);
//     console.log("Connected to MongoDB");

//     // 1️⃣ Find all active consultant accounts
//     const activeConsultants = await Account.find({
//         role: "consultant",
//         status: "active",
//     }).select("_id status firstName lastName email");

//     console.log(`Found ${activeConsultants.length} active consultants`);

//     // 2️⃣ Loop through each consultant
//     for (const consultant of activeConsultants) {
//         // Find corresponding ConsultantProfile
//         const profile = await ConsultantProfile.findOne({ account: consultant._id });
//         if (!profile) {
//             console.log(
//                 `No ConsultantProfile found for ${consultant.firstName} ${consultant.lastName} (${consultant._id})`
//             );
//             continue; // skip
//         }

//         // Update status
//         if (profile.status !== consultant.status) {
//             profile.status = consultant.status as any;
//             await profile.save();
//             console.log(
//                 `Updated status for ${consultant.firstName} ${consultant.lastName} to ${consultant.status}`
//             );
//         }
//     }

//     console.log("Status sync completed");
//     await mongoose.disconnect();
// }

// main().catch((err) => {
//     console.error("Error syncing consultant statuses:", err);
//     mongoose.disconnect();
// });