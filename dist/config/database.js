"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
require('dotenv').config();
const connectDB = async () => {
    try {
        const connection = await mongoose_1.default.connect(process.env.ATLAS_DATABASE_URI);
    }
    catch (err) {
        console.log(err);
    }
};
exports.default = connectDB;
