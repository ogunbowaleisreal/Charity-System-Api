"use strict";
// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import { Account } from "../models/Accounts";
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID!,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     callbackURL: process.env.GOOGLE_CALLBACK_URL
// },
//     async (accessToken, refreshToken, profile, done) => {
//         try {
//             // Check if user exists by googleId
//             let user = await Account.findOne({ googleId: profile.id });
//             if (!user) {
//                 // Create user if doesn't exist
//                 user = await Account.create({
//                     googleId: profile.id,
//                     firstName: profile.name?.givenName,
//                     lastName: profile.name?.familyName,
//                     picture: profile.photos?.[0]?.value,
//                     email: profile.emails?.[0].value!,
//                     role: "client" // default, or ask user after first login
//                 });
//             }
//             return done(null, user);
//         } catch (err) {
//             return done(err, false, {
//                 message:
//                     err instanceof Error
//                         ? err.message
//                         : "Authentication failed",
//             });
//         }
//     }));
// passport.serializeUser((user: any, done) => done(null, user.id));
// passport.deserializeUser(async (id, done) => {
//     const user = await Account.findById(id);
//     done(null, user);
// });
