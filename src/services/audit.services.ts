import { ClientSession } from "mongoose";
import { AuditLog } from "../models/Auditlogs";
import { ActorType, AuditAction } from "../types/auditlogs.types";

interface LogAuditParams {
    actorType: ActorType;
    actorId: string;
    actorEmail?: string;
    action: AuditAction | string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    session?: ClientSession; // pass this when inside a transaction
}

export async function logAudit({ session, ...params }: LogAuditParams): Promise<void> {
    try {
        if (session) {
            await AuditLog.create([params], { session });
        } else {
            await AuditLog.create(params);
        }
    } catch (err) {
        console.error("[AuditLog] Failed to write audit log:", err, params);
        // Deliberately not re-thrown: a logging failure should never fail the transaction it's describing.
        // If this session aborts for its own reasons, the log rolls back too — which is correct.
    }
}
// import { AuditLog } from "../models/Auditlogs";
// import { ActorType, AuditAction } from "../types/auditlogs.types";

// interface LogAuditParams {
//     actorType: ActorType;
//     actorId: string;
//     actorEmail?: string;
//     action: AuditAction | string;
//     targetType?: string;
//     targetId?: string;
//     metadata?: Record<string, any>;
//     ipAddress?: string;
//     userAgent?: string;
// }

// export async function logAudit(params: LogAuditParams): Promise<void> {
//     try {
//         await AuditLog.create(params);
//     } catch (err) {
//         // Never let a logging failure break the actual action.
//         // Send this to your error tracker (Sentry etc.) so silent audit failures don't go unnoticed.
//         console.error("[AuditLog] Failed to write audit log:", err, params);
//     }
// }