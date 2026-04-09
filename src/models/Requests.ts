import { Schema, model, Document } from "mongoose";


export interface IRequest extends Document {
    _id: Schema.Types.ObjectId,
    client: Schema.Types.ObjectId,
    admin: Schema.Types.ObjectId,
    businessCategory: Schema.Types.ObjectId,
    amount: number,
    name: string,
    email: string,
    companyIndustry: string,
    jobTime: string,
    status: string
    message: string,
    approvedHrCount: number,

    jobDuration: { value: number, unit: string },
    //requiredHrCount: number
    //assignedHR: Schema.Types.ObjectId,
    //assignedHRCount: number
    workType: [string]
    experienceLevel: "Intern" | "Junior" | "Intermediate" | "Senior" | "Executive"
    biddingStartDate: Date,
    biddingEndDate: Date
}
const RequestSchema = new Schema<IRequest>({
    admin: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    //client: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    businessCategory: { type: Schema.Types.ObjectId, ref: "BusinessCategory", required: true },
    companyIndustry: { type: String },
    amount: { type: Number, required: true },
    name: { type: String, required: true },
    //email: { type: String, required: true },
    message: { type: String, required: true },
    //jobTime: { type: String, required: true },
    //requiredHrCount: { type: Number, required: true },
    //approvedHrCount: { type: Number, default: 0 },
    // assignedHRCount: { type: Number, default: 0 },
    // assignedHRCount: {
    //     type: Number,
    //     default: 0,
    //     min: 0,
    //     validate: {
    //         validator: function (v) {
    //             return v <= this.requiredHrCount;
    //         },
    //         message: "assignedHRCount cannot exceed requiredHrCount"
    //     }
    // }
    //,
    workType: { type: [String], required: true, enum: ["Physical", "Remote", "Hybrid"] },
    status: {
        type: String, enum: [
            "pending",
            // "accepted",
            "ongoing",
            //  "partially completed",
            // "completed",
            "ended"
        ], default: "pending"
    },
    // jobDuration: {
    //     value: { type: Number, required: true }, // e.g. 3
    //     unit: {
    //         type: String,
    //         enum: ["days", "weeks", "months"],
    //         required: true
    //     }
    // },

    //assignedHR: { type: Schema.Types.ObjectId, ref: "Account", required: true, default: null },
    biddingStartDate: { type: Date, default: Date.now },
    experienceLevel: { type: String, enum: ["Intern", "Junior", "Intermediate", "Senior", "Executive"], required: true },
    biddingEndDate: { type: Date }
}, { timestamps: true });
RequestSchema.index({ createdAt: -1, _id: -1 });


export default model("Request", RequestSchema);