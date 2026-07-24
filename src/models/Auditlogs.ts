import mongoose, { Schema, Model } from "mongoose";
import { IAuditLog, ActorType } from "../types/auditlogs.types";

interface IAuditLogModel extends Model<IAuditLog> { }

const auditLogSchema = new Schema<IAuditLog>(
    {
        actorType: {
            type: String,
            enum: Object.values(ActorType),
            required: true,
            index: true,
        },
        actorId: {
            type: String,
            required: true,
            index: true,
        },
        actorEmail: {
            type: String,
            default: null,
        },
        action: {
            type: String,
            required: true,
            index: true,
        },
        targetType: {
            type: String,
            default: null,
        },
        targetId: {
            type: String,
            default: null,
            index: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
        ipAddress: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: "audit_logs",
    }
);

// Common query patterns: "show me everything this actor did", "show me this campaign's history",
// "show me all admin.* actions in the last 30 days"
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog, IAuditLogModel>("AuditLog", auditLogSchema);
export default AuditLog;