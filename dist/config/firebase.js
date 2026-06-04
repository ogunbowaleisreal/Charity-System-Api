"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messaging = exports.firebaseAdmin = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}
exports.firebaseAdmin = firebase_admin_1.default;
exports.messaging = firebase_admin_1.default.messaging();
// import admin from "firebase-admin";
// import serviceAccount from "./firebase-service-account.json";
// /**
//  * Initialize Firebase Admin SDK
//  * This is used ONLY on the backend to verify ID tokens
//  */
// if (!admin.apps.length) {
//     admin.initializeApp({
//         credential: admin.credential.cert(
//             serviceAccount as admin.ServiceAccount
//         ),
//     });
// }
// export const firebaseAdmin = admin;
