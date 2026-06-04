"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankDetail = void 0;
const mongoose_1 = require("mongoose");
const bankDetailSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
        index: true,
    },
    bankName: {
        type: String,
        required: true,
        trim: true,
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true,
    },
    accountName: {
        type: String,
        required: true,
        trim: true,
    },
    bankCode: {
        type: String,
        required: true,
        trim: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
exports.BankDetail = (0, mongoose_1.model)("BankDetail", bankDetailSchema);
