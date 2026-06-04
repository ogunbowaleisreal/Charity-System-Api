"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const Accounts_1 = require("../models/Accounts");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists by googleId
        let user = await Accounts_1.Account.findOne({ googleId: profile.id });
        if (!user) {
            // Create user if doesn't exist
            user = await Accounts_1.Account.create({
                googleId: profile.id,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                picture: profile.photos?.[0]?.value,
                email: profile.emails?.[0].value,
                role: "client" // default, or ask user after first login
            });
        }
        return done(null, user);
    }
    catch (err) {
        return done(err, false, {
            message: err instanceof Error
                ? err.message
                : "Authentication failed",
        });
    }
}));
passport_1.default.serializeUser((user, done) => done(null, user.id));
passport_1.default.deserializeUser(async (id, done) => {
    const user = await Accounts_1.Account.findById(id);
    done(null, user);
});
