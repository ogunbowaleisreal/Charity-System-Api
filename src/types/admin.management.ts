export interface AdminUpdatePayload {
    name?: string;
    email?: string;
    adminLevel?: string
}
import { Document, Schema, Types } from "mongoose";
import { Request } from "express";
import { AnnounceController } from "../controllers/admin/Announcement.controller";

export interface AdminJWTPayload {
    id: string;
    adminId: string;
    email: string;
    adminLevel: string;
    permissions?: string[];
    generation?: number;
    tokenId?: string;
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string;
}
export interface AdminAuthenticatedRequest extends Request {
    admin?: AdminJWTPayload;
    params: any;
    body: any;
    query: any;
    route: any;
    get: any;
}

export interface CreateAdminRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    adminLevel: string;
    permissions?: string[];
    phone?: string;
}

export interface UpdateAdminRequest {
    firstName?: string;
    lastName?: string;
    adminLevel?: string;
    permissions?: string[];
    phone?: string;
}

//import { Document, Schema } from "mongoose";

//import { Document, Schema } from "mongoose";

export interface IAdmin extends Document {
    _id: Types.ObjectId;

    // Basic Information
    firstName: string;
    lastName: string;
    fullName: string; // virtual

    email: string;
    phone?: string;
    profilePicture?: string;
    gender?: "male" | "female" | "other" | "prefer_not_to_say";

    // Profile / Personal Details
    about?: string;
    countryOfResidence?: string;
    stateOfResidence?: string;
    city?: string;
    cityOfResidence?: string;
    stateOfOrigin?: string;
    countryOfOrigin?: string;
    homeAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
    postalCode?: string;

    // Authentication & Security
    password: string;
    passwordHistory: string[];
    twoFactorEnabled: boolean;
    activeTokenId?: string | null;

    // Role & Permissions
    adminLevel: string;
    status: "active" | "pending_verification" | "suspended" | "deactivated";
    permissions: string[];
    suspendedBy: string;

    // Login / Security Tracking
    loginAttempts: number;
    lockUntil?: Date;
    lastLogin?: Date;
    lastActiveAt?: Date;
    totalLogins: number;

    // Audit
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;

    // Instance Methods
    comparePassword(candidatePassword: string): Promise<boolean>;
    incrementLoginAttempts(): Promise<void>;
    resetLoginAttempts(): Promise<void>;
    checkAccountLock(): boolean;
    isLocked(): boolean;
    hasPermission(permission: string): boolean;
    updateLastActive(): Promise<void>;
}



// export interface IAdmin extends Document {
//     _id: Schema.Types.ObjectId;
//     __v: number;
//     firstName: string;
//     lastName: string;
//     email: string;
//     password: string;
//     adminLevel: string;
//     status: "active" | "pending_verification" | "suspended" | "deactivated";
//     permissions: string[];
//     twoFactorEnabled: boolean;
//     loginAttempts: number;
//     profilePicture: string;
//     lockUntil?: Date;
//     lastLogin?: Date;
//     passwordHistory: string[];
//     phone?: string;
//     lastActiveAt?: Date;
//     totalLogins: number;
//     createdBy?: string;
//     updatedBy?: string;
//     createdAt: Date;
//     updatedAt: Date;
//     activeTokenId?: string | null;

//     // Virtual fields
//     fullName: string;

//     // Instance methods
//     comparePassword(candidatePassword: string): Promise<boolean>;
//     incrementLoginAttempts(): Promise<void>;
//     resetLoginAttempts(): Promise<void>;
//     checkAccountLock(): boolean;
//     hasPermission(permission: string): boolean;
//     updateLastActive(): Promise<void>;
//     isLocked(): boolean;
// }

// Static methods interface
export interface IAdminModel {
    findByEmail(email: string): Promise<IAdmin | null>;
    createAdmin(adminData: Partial<IAdmin>): Promise<IAdmin>;
}

// Admin permissions enum
export const ADMIN_PERMISSIONS = {
    // User management permissions
    ACCOUNTS: {
        VIEW: "accounts.view",
        SUSPEND: "accounts.suspend",
        VERIFY: "accounts.verify",
        UPDATE: "accounts.update",
        ASSIGN: "accounts.assign",
        APPROVE: "accounts.approve",
        DECLINE: "accounts.decline",
    },

    CAMPAIGNS: {
        VIEW: "campaign.view",
        CREATE: "campaign.create",
        UPDATE: "campaign.update",
        DELETE: "campaign.delete",
        SUSPEND: "campaign.suspend",
    },
    KYC: {
        VIEW: "kyc.view",
        APPROVE: "kyc.approve",
        REJECT: "kyc.reject",
    },
    DONATIONS: {
        VIEW: "donation.view",
        // APPROVE: "donation.approve",
        // REJECT: "donation.reject",
    },
    BANNER: {
        UPDATE: "banner.update",
        DELETE: "banner.delete",
        VIEW: "banner.view",
        CREATE: "banner.create"
    },

    // BIDS: {
    //     VIEW: "bids.view",
    //     APPROVE: "bids.approve",
    //     REJECT: "bids.reject",
    // },

    CONTENT: {
        VIEW: "content.view",
        CREATE: "content.create",
        UPDATE: "content.update",
        DELETE: "content.delete"
    },

    TAG: {
        CREATE: "tag.create",
        VIEW: "tag.view",
        UPDATE: "tag.update",
        DELETE: "tag.delete"
    },
    WITHDRAWAL: {
        VIEW: "withdrawal.view",
        APPROVE: "withdrawal.approve",
        REJECT: "withdrawal.reject",
    },

    GRATUITY: {
        VIEW: "gratuity.view",
        CREATE: "gratuity.create",
        UPDATE: "gratuity.update",
        DELETE: "gratuity.delete"
    },
    SERVICE_FEE: {
        VIEW: "servicefee.view",
        CREATE: "servicefee.create",
        UPDATE: "servicefee.update",
        DELETE: "servicefee.delete"
    },

    // Listing management permissions
    // LISTING: {
    //   VIEW: "listing.view",
    //   APPROVE: "listing.approve",
    //   REJECT: "listing.reject",
    //   SUSPEND: "listing.suspend",
    //   MANAGE_REVIEWS: "listing.manage_reviews",
    //   VIEW_LISTING_CATEGORIES: "listing.view_categories",
    //   CREATE_LISTING_CATEGORIES: "listing.add_categories",
    //   DELETE_LISTING_CATEGORIES: "listing.delete_categories",
    //   UPDATE_LISTING_CATEGORIES: "listing.update_categories",
    // },

    // Admin management permissions
    ADMIN: {
        VIEW: "admin.view",
        CREATE: "admin.create",
        UPDATE: "admin.update",
        DELETE: "admin.delete",
        MANAGE_ROLES: "admin.manage_roles",
        VIEW_ROLES: "admin.view_roles",
        CREATE_ROLES: "admin.create_roles",
        UPDATE_ROLES: "admin.update_roles",
        DELETE_ROLES: "admin.delete_roles",
        ASSIGN_PERMISSIONS: "admin.assign_permissions",
        ADMIN_STATS: "admin.view_admin_stats",
        SUSPEND: "admin.suspend"
    },

    // NOTIFICATION: {
    //     VIEW: "notification.view",
    //     CREATE: "notification.create",
    //     UPDATE: "notification.update",
    //     DELETE: "notification.delete"
    // },

    ANNOUNCEMENT: {
        VIEW: "announcement.view",
        CREATE: "announcement.create",
        UPDATE: "announcement.update",
        DELETE: "announcement.delete"
    },

    // Financial permissions
    TRANSACTIONS: {
        VIEW: "transactions.view_transactions",
        MANAGE_PAYMENTS: "transactions.manage_payments",
        REFUNDS: "transactions.refunds",
        ANALYTICS: "transactions.analytics",
    },
    COMMENTS: {
        VIEW: "comments.view",
        CREATE: "comments.create",
        UPDATE: "comments.update",
        DELETE: "comments.delete"
    },

    // Artile management permissions
    // ARTICLE: {
    //   VIEW: "article.view",
    //   CREATE: "article.create",
    //   UPDATE: "article.update",
    //   DELETE: "article.delete",
    //   PUBLISH: "article.publish",
    //   UNPUBLISH: "article.unpublish",
    // },
    //Dashboard management permissions
    DASHBOARD: {
        OVERVIEW: "dashboard.overview",
        //   VIEW_WEDDING_STAT: "dashboard.wedding_stats",
        //   VIEW_ARTICLE_STATS: "dashboard.article_stats",
        //   VIEW_PAYMENT_STATS: "dashboard.payment_stats",
        //   VIEW_LISTING_STATS: "dashboard.listing_stats",
        //   VIEW_ACCOUNT_STATS: "dashboard.account_stats",
        VIEW_FAQS_STATS: "dashboard.faqs_stats",
        //   VIEW_SUBSCRIPTION_STATS: "dashboard.subscription_stats",
    },

    //Faqs management permissions
    FAQS: {
        VIEW: "faqs.view",
        CREATE: "faqs.create",
        UPDATE: "faqs.update",
        DELETE: "faqs.delete",
        // PUBLISH: "faqs.publish",
        // UNPUBLISH: "faqs.unpublish",
        // VIEW_FAQS_CATEGORIES: "faqs.view_categories",
        // CREATE_FAQS_CATEGORIES: "faqs.add_categories",
        // DELETE_FAQS_CATEGORIES: "faqs.delete_categories",
        // UPDATE_FAQS_CATEGORIES: "faqs.update_categories",
    },

    // SUBSCRIPTIONPLAN: {
    //     VIEW: "subscription.view",
    //     UPDATE: "subscription.update",
    // },
    // ANNOUNCEMENT: {
    //   VIEW: "announcement.view",
    //   CREATE: "announcement.create",
    //   UPDATE: "announcement.update",
    //   DELETE: "announcement.delete",
    // },

    SUPPORT: {
        VIEW: "support.view",
        UPDATE: "support.update",
    },

    //Plans management permissions
    // PLAN: {
    //     VIEW: "plan.view",
    //     UPDATE: "plan.update",
    //     CREATE: "plan.create",
    //     MIGRATE: "plan.migrate",
    // },
    // REQUESTS: {
    //     VIEW: "request.view",
    //     CREATE: "request.create",
    //     UPDATE: "request.update",
    //     DELETE: "request.delete",
    //     ASSIGN: "request.assign",
    // },

    // Wedding management permissions
    // EVENTS: {
    //   VIEW: "events.view",
    // },
} as const;

// Extract all permission values for validation
export type AdminPermission = {}
//  | (typeof ADMIN_PERMISSIONS.ACCOUNTS)[keyof typeof ADMIN_PERMISSIONS.ACCOUNTS]
// | (typeof ADMIN_PERMISSIONS.LISTING)[keyof typeof ADMIN_PERMISSIONS.LISTING]
//  | (typeof ADMIN_PERMISSIONS.ADMIN)[keyof typeof ADMIN_PERMISSIONS.ADMIN]
// | (typeof ADMIN_PERMISSIONS.FAQS)[keyof typeof ADMIN_PERMISSIONS.FAQS]
// | (typeof ADMIN_PERMISSIONS.DASHBOARD)[keyof typeof ADMIN_PERMISSIONS.DASHBOARD]
// | (typeof ADMIN_PERMISSIONS.ARTICLE)[keyof typeof ADMIN_PERMISSIONS.ARTICLE]
// | (typeof ADMIN_PERMISSIONS.DASHBOARD)[keyof typeof ADMIN_PERMISSIONS.DASHBOARD]
//| (typeof ADMIN_PERMISSIONS.EVENTS)[keyof typeof ADMIN_PERMISSIONS.EVENTS]
// | (typeof ADMIN_PERMISSIONS.JOB)[keyof typeof ADMIN_PERMISSIONS.JOB]
//   | (typeof ADMIN_PERMISSIONS.PLAN)[keyof typeof ADMIN_PERMISSIONS.PLAN]
// | (typeof ADMIN_PERMISSIONS.ANNOUNCEMENT)[keyof typeof ADMIN_PERMISSIONS.ANNOUNCEMENT]
//| (typeof ADMIN_PERMISSIONS.SUPPORT)[keyof typeof ADMIN_PERMISSIONS.SUPPORT]
// | (typeof ADMIN_PERMISSIONS.SUBSCRIPTIONPLAN)[keyof typeof ADMIN_PERMISSIONS.SUBSCRIPTIONPLAN];

export const ALL_PERMISSIONS = Object.values(ADMIN_PERMISSIONS).flatMap(
    (category) => Object.values(category)
);

// Pagination interface
export interface PaginationResult<T> {
    data: T[];
    pagination: {
        current: number;
        pages: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// Admin statistics interface
export interface AdminStatistics {
    byLevel: Array<{
        _id: string;
        count: number;
        active: number;
        suspended: number;
        deactivated: number;
    }>;
    overall: {
        total: number;
        active: number;
        recentLogins: number;
    };
}
