import { Schema, model, Types } from "mongoose";

export interface IMonthlyReport {
    consultant: Types.ObjectId;
    fileName: string;
    client: Types.ObjectId;                   // Who uploaded
    year: number;
    request: Types.ObjectId                            // 2025
    month: number;                            // 1–12
    documentUrl: string;
    type: "report" | "complain"                     // ImageKit URL
    documentFileId: string;
    complainFrom: Types.ObjectId
    complain: string;                   // For deleting/replacing file in ImageKit
    uploadedAt: Date;
    complainAbout: Types.ObjectId                         // Actual upload timestamp
    updatedAt?: Date;                          // When replaced
    status: "uploaded" | "replaced";          // Helpful for history UI
    metadata?: {
        originalName?: string;
        size?: number;                        // in bytes
        mimeType?: string;
    };
}

const ReportSchema = new Schema<IMonthlyReport>(
    {
        consultant: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: function (this: IMonthlyReport) {
                return this.type == "report"
            },
            index: true,
        },
        fileName: {
            type: String,
            required: function (this: IMonthlyReport) {
                return this.type == "report"
            },
        },
        client: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: function (this: IMonthlyReport) {
                return this.type == "report"
            },
            index: true,
        },
        complainFrom: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: function (this: IMonthlyReport) {
                return this.type == "complain"
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
            required: function (this: IMonthlyReport) {
                return this.type == "report"
            },
            min: 2000,
            max: 2100,
        },

        month: {
            type: Number,
            required: function (this: IMonthlyReport) {
                return this.type == "report"
            },
            min: 1,
            max: 12,
        },
        complain: {
            type: String,
            required: function (this: IMonthlyReport) {
                return this.type == "complain"
            },
        },
        complainAbout: {
            type: Schema.Types.ObjectId,
            required: function (this: IMonthlyReport) {
                return this.type == "complain"
            },
            ref: "Account"
        },

        documentUrl: {
            type: String,
            required: function (this: IMonthlyReport) {
                return this.type == "report"
            },
        },

        documentFileId: {
            type: String,
            required: function (this: IMonthlyReport) {
                return this.type == "report"
            },   // Needed for deletion in ImageKit
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
    },
    {
        timestamps: false, // we use custom fields
    }
);

// Each consultant can upload ONLY ONE REPORT per year+month
ReportSchema.index(
    { consultant: 1, client: 1, year: 1, month: 1 },
    // {
    //     unique: true,
    //     partialFilterExpression: { type: "report" }
    // }
);




export const MonthlyReport = model<IMonthlyReport>("Report", ReportSchema);
