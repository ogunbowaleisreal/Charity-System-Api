export enum ActorType {
    ADMIN = "admin",
    USER = "user",
    SYSTEM = "system", // for automated actions, e.g. cron jobs, webhooks
}

// Group actions by domain so autocomplete + filtering stays clean as this grows
export const AUDIT_ACTIONS = {
    ADMIN: {
        LOGIN: "admin.login",
        LOGIN_FAILED: "admin.login_failed",
        LOGOUT: "admin.logout",
        CREATE_ADMIN: "admin.create_admin",
        UPDATE_PERMISSIONS: "admin.update_permissions",
        SUSPEND_ADMIN: "admin.suspend_admin",
        // LOGIN: "admin.login",
        // LOGIN_FAILED: "admin.login_failed",
        LOGIN_BLOCKED_SUSPENDED: "admin.login_blocked_suspended",
        LOGIN_BLOCKED_LOCKED: "admin.login_blocked_locked",
        // LOGOUT: "admin.logout",
        TWO_FA_VERIFIED: "admin.two_fa_verified",
        PASSWORD_RESET: "admin.password_reset",
        TOKEN_REUSE_DETECTED: "admin.token_reuse_detected",
    },
    CAMPAIGN: {
        CREATED: "campaign.created",
        UPDATED: "campaign.updated",
        DELETED: "campaign.deleted",
        SUSPENDED_BY_ADMIN: "campaign.suspended_by_admin",
        APPROVED_BY_ADMIN: "campaign.approved_by_admin",
    },

    DONATION: {
        INITIATED: "donation.initiated",
        CREATED: "donation.created",       // use this once payment is confirmed
        FAILED: "donation.failed",         // use this once payment is confirmed failed
        REFUNDED: "donation.refunded",
    },
    PAYOUT: {
        REQUESTED: "payout.requested",
        APPROVED_BY_ADMIN: "payout.approved_by_admin",
        REJECTED_BY_ADMIN: "payout.rejected_by_admin",
        SENT: "payout.sent",
        FAILED: "payout.failed",
        WITHDRAWN_TO_WALLET: "payout.withdrawn_to_wallet",
        USER: {
            SUSPENDED_BY_ADMIN: "user.suspended_by_admin",
            BANNED_BY_ADMIN: "user.banned_by_admin",
        },
    },
    WALLET: {
        PIN_SET: "wallet.pin_set",
        PIN_RESET_REQUESTED: "wallet.pin_reset_requested",
        PIN_CHANGED: "wallet.pin_changed",
        TWO_FA_WITHDRAWAL_ENABLED: "wallet.two_fa_withdrawal_enabled",
        TWO_FA_WITHDRAWAL_DISABLED: "wallet.two_fa_withdrawal_disabled",
    },
} as const;

// Flatten into a union type for type safety on the `action` field
type ValueOf<T> = T[keyof T];
export type AuditAction = ValueOf<{ [K in keyof typeof AUDIT_ACTIONS]: ValueOf<typeof AUDIT_ACTIONS[K]> }>;

export interface IAuditLog {
    actorType: ActorType;
    actorId: string;          // Admin _id or User _id
    actorEmail?: string;      // denormalized so it survives if the actor is later deleted
    action: AuditAction | string;
    targetType?: string;      // "Campaign", "Donation", "User", "Admin", "Payout"
    targetId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt?: Date;
}