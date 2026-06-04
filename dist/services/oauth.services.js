"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthService = void 0;
const Accounts_1 = require("../models/Accounts");
const google_1 = require("../config/google");
class oauthService {
    async handleGoogleCallback(code) {
        const { tokens } = await google_1.oauth2Client.getToken(code);
        google_1.oauth2Client.setCredentials(tokens);
        const ticket = await google_1.oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const user_data = {
            email: payload?.email,
            name: payload?.name,
            picture: payload?.picture,
            googleId: payload,
            verified: ""
        };
        const user = await Accounts_1.Account.findOne({ email: user_data?.email });
        if (!user) {
            const newUser = await Accounts_1.Account.create({
                username: user_data.name,
                email: user_data.email,
                picture: user_data.picture,
                provider: 'google',
                verified: "",
                role: "",
            });
            return { user_id: newUser._id, role: newUser.role };
        }
        return { user_id: user._id, role: user.role };
    }
}
exports.oauthService = oauthService;
