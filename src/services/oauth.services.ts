// import { Account } from "../models/Accounts";
// import { oauth2Client } from "../config/google";


// export class oauthService {

//     async handleGoogleCallback(code: string) {
//         const { tokens } = await oauth2Client.getToken(code);
//         oauth2Client.setCredentials(tokens);

//         const ticket = await oauth2Client.verifyIdToken({
//             idToken: tokens.id_token!,
//             audience: process.env.GOOGLE_CLIENT_ID!
//         })
//         const payload = ticket.getPayload()
//         const user_data = {
//             email: payload?.email,
//             name: payload?.name,
//             picture: payload?.picture,
//             googleId: payload,
//             verified: ""
//         }
//         const user = await Account.findOne({ email: user_data?.email });
//         if (!user) {
//             const newUser = await Account.create({
//                 username: user_data.name!,
//                 email: user_data.email!,
//                 picture: user_data.picture,
//                 provider: 'google',
//                 verified: "",
//                 role: "",

//             });
//             return { user_id: newUser._id, role: newUser.role };
//         }
//         return { user_id: user._id, role: user.role }
//     }
// }