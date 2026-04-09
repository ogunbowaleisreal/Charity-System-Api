import admin from "firebase-admin";
import { firebase } from "googleapis/build/src/apis/firebase";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID as string,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}

export const firebaseAdmin = admin;
export const messaging = admin.messaging();

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
