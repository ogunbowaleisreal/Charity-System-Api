"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
const mongoose_1 = require("mongoose");
const AdminModel_1 = __importDefault(require("./AdminModel")); // make sure this path is correct
const roleSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: true,
        maxlength: 500,
    },
    permissions: [String],
    isVisible: {
        type: Boolean,
        default: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});
// Hide "super_admin" role from visibility
roleSchema.pre("save", function (next) {
    if (this.name === "super_admin") {
        this.isVisible = false;
    }
    next();
});
// 🔥 Automatically update all admins when a role's permissions are changed
roleSchema.pre("findOneAndUpdate", async function (next) {
    const update = this.getUpdate();
    console.log("got here");
    console.log(update.permissions);
    // Only trigger if permissions are being updated
    if (update?.$set.permissions) {
        const docToUpdate = await this.model.findOne(this.getQuery());
        console.log("got here too");
        console.log(docToUpdate);
        if (docToUpdate) {
            const updated = await AdminModel_1.default.updateMany({ adminLevel: docToUpdate.name }, { $set: { permissions: update.$set.permissions } });
        }
    }
    next();
});
// Static method to find visible roles
roleSchema.statics.findVisible = function (query = {}) {
    return this.find({ ...query, isVisible: true });
};
// Static method to find visible roles with pagination and filters
roleSchema.statics.findVisibleWithPagination = function (page = 1, limit = 10, filters = {}, sortBy = "createdAt", sortOrder = "desc") {
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const query = { isVisible: true };
    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: "i" } },
            { description: { $regex: filters.search, $options: "i" } },
        ];
    }
    return Promise.all([
        this.find(query)
            .sort({ [sortBy]: sortDirection })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
        this.countDocuments(query),
    ]);
};
exports.Role = (0, mongoose_1.model)("Role", roleSchema);
// import { Schema, model, Document } from "mongoose";
// export interface IRole extends Document {
//   name: string;
//   description: string;
//   permissions: string[];
//   isVisible: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }
// const roleSchema = new Schema<IRole>(
//   {
//     name: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       lowercase: true,
//     },
//     description: {
//       type: String,
//       required: true,
//       maxlength: 500,
//     },
//     permissions: [String],
//     isVisible: {
//       type: Boolean,
//       default: true,
//     },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
//   },
//   {
//     timestamps: true,
//   }
// );
// roleSchema.pre("save", function (next) {
//   if (this.name === "super_admin") {
//     this.isVisible = false;
//   }
//   next();
// });
// roleSchema.statics.findVisible = function (query = {}) {
//   return this.find({ ...query, isVisible: true });
// };
// roleSchema.statics.findVisibleWithPagination = function (
//   page: number = 1,
//   limit: number = 10,
//   filters: any = {},
//   sortBy: string = "createdAt",
//   sortOrder: "asc" | "desc" = "desc"
// ) {
//   const skip = (page - 1) * limit;
//   const sortDirection = sortOrder === "asc" ? 1 : -1;
//   const query: any = { isVisible: true };
//   if (filters.search) {
//     query.$or = [
//       { name: { $regex: filters.search, $options: "i" } },
//       { description: { $regex: filters.search, $options: "i" } },
//     ];
//   }
//   return Promise.all([
//     this.find(query)
//       .sort({ [sortBy]: sortDirection })
//       .skip(skip)
//       .limit(limit)
//       .lean()
//       .exec(),
//     this.countDocuments(query),
//   ]);
// };
// export const Role = model<IRole>("Role", roleSchema);
