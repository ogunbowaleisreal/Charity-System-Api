"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyReport = void 0;
const mongoose_1 = require("mongoose");
const ReportSchema = new mongoose_1.Schema({
    consultant: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        required: function () {
            return this.type == "report";
        },
        index: true,
    },
    fileName: {
        type: String,
        required: function () {
            return this.type == "report";
        },
    },
    client: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        required: function () {
            return this.type == "report";
        },
        index: true,
    },
    complainFrom: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        required: function () {
            return this.type == "complain";
        },
    },
    // request: {
    //     type: Schema.Types.ObjectId,
    //     ref: "Request",
    //     required: true,
    //     index: true,
    // },
    year: {
        type: Number,
        required: function () {
            return this.type == "report";
        },
        min: 2000,
        max: 2100,
    },
    month: {
        type: Number,
        required: function () {
            return this.type == "report";
        },
        min: 1,
        max: 12,
    },
    complain: {
        type: String,
        required: function () {
            return this.type == "complain";
        },
    },
    complainAbout: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: function () {
            return this.type == "complain";
        },
        ref: "Account"
    },
    documentUrl: {
        type: String,
        required: function () {
            return this.type == "report";
        },
    },
    documentFileId: {
        type: String,
        required: function () {
            return this.type == "report";
        }, // Needed for deletion in ImageKit
    },
    type: {
        type: String,
        enum: ["report", "complain"],
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
    // status: {
    //     type: String,
    //     enum: ["uploaded", "replaced"],
    //     default: "uploaded",
    // },
    // date:{
    //     type:Date()
    // },
    metadata: {
        originalName: String,
        size: Number,
        mimeType: String,
    },
}, {
    timestamps: false, // we use custom fields
});
// Each consultant can upload ONLY ONE REPORT per year+month
ReportSchema.index({ consultant: 1, client: 1, year: 1, month: 1 });
exports.MonthlyReport = (0, mongoose_1.model)("Report", ReportSchema);
