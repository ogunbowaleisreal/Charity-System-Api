"use strict";
// import mongoose, { Schema, Document } from "mongoose";
// import roles, { IRole } from "./roles";
// export interface IAdmin extends Document {
//     name: string;
//     email: string;
//     password: string;
//     adminLevel?: string;
//     role: IRole;
//     permissions: string[];
//     additionalPermissions?: string[];
//     createdAt: Date;
//     updatedAt: Date;
// }
// const adminSchema = new Schema<IAdmin>(
//     {
//         name: { type: String, required: true },
//         email: { type: String, unique: true, required: true },
//         password: { type: String, required: true },
//         adminLevel: {
//             type: String, required: true,
//             validate: {
//                 validator: async function (value: string) {
//                     const role = await roles.findOne({ name: value.toLowerCase() });
//                     return !!role;
//                 }
//             }
//         },
//         role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
//         additionalPermissions: { type: [String], required: false, default: [] },
//     },
//     { timestamps: true }
// );
// export const Admin = mongoose.model<IAdmin>("Admin", adminSchema);
