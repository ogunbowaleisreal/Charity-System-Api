"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminManagementService = void 0;
// @/services/admin/adminManagementService.ts
const AdminModel_1 = require("../../models/AdminModel");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const ResesndServices_1 = require("../ResesndServices");
class AdminManagementService {
    constructor() {
        this.emailService = new ResesndServices_1.ResendEmailService();
    }
    async createAdmin(data, creatorId) {
        const { firstName, lastName, email, adminLevel, phone } = data;
        try {
            // Check if admin with email already exists
            const existingAdmin = await AdminModel_1.Admin.findByEmail(email);
            if (existingAdmin) {
                throw {
                    message: "Admin with this email already exists",
                    statusCode: constants_1.HTTP_STATUS.CONFLICT,
                };
            }
            const newPassword = (0, helpers_1.generatePasswordCrypto)();
            // Create admin data
            const adminData = {
                firstName,
                lastName,
                email: email.toLowerCase(),
                password: newPassword,
                adminLevel,
                phone,
                createdBy: creatorId,
            };
            console.log(newPassword);
            // Create and save admin
            const admin = await AdminModel_1.Admin.createAdmin(adminData);
            await this.emailService.sendAdminWelcomeEmail(admin.email, admin.firstName, admin.adminLevel, newPassword);
            logger_1.default.info("Admin account created successfully", {
                adminId: admin._id.toString(),
                email: admin.email,
                adminLevel: admin.adminLevel,
                createdBy: creatorId,
            });
            return admin;
        }
        catch (error) {
            logger_1.default.error("Failed to create admin account", {
                email,
                error: error.message,
                createdBy: creatorId,
            });
            throw error;
        }
    }
    async getAllAdmins(query) {
        const { page = 1, limit = 10, adminLevel, status, search } = query;
        const EXCLUDED_EMAIL = "softwebdigital@gmail.com";
        const filter = {
            email: { $ne: EXCLUDED_EMAIL } // 👈 exclude this one admin
        };
        if (adminLevel)
            filter.adminLevel = adminLevel;
        if (status)
            filter.status = status;
        if (search) {
            const regex = new RegExp(search, "i");
            filter.$or = [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
                { phone: regex },
            ];
        }
        const skip = (page - 1) * limit;
        const [admins, total] = await Promise.all([
            AdminModel_1.Admin.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
            AdminModel_1.Admin.countDocuments(filter),
        ]);
        return {
            admins,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async getAdminById(adminId) {
        const admin = await AdminModel_1.Admin.findById(adminId);
        if (!admin) {
            throw {
                message: "Admin not found",
                statusCode: constants_1.HTTP_STATUS.NOT_FOUND,
            };
        }
        return admin;
    }
    async updateAdmin(adminId, data, updatedBy) {
        const admin = await AdminModel_1.Admin.findById(adminId);
        if (!admin) {
            throw {
                message: "Admin not found",
                statusCode: constants_1.HTTP_STATUS.NOT_FOUND,
            };
        }
        // Update allowed fields
        const allowedUpdates = [
            "firstName",
            "lastName",
            "phone",
            "status",
            "permissions",
            "adminLevel",
        ];
        allowedUpdates.forEach((field) => {
            if (data[field] !== undefined) {
                admin[field] = data[field];
            }
        });
        admin.updatedBy = updatedBy;
        await admin.save();
        logger_1.default.info("Admin account updated", {
            adminId,
            updatedBy,
            updatedFields: Object.keys(data),
        });
        return admin;
    }
    async suspendAdmin(adminId, action, 
    // data: UpdateAdminRequest,
    suspendedBy, reason) {
        const admin = await AdminModel_1.Admin.findById(adminId);
        if (!admin) {
            throw {
                message: "Admin not found",
                statusCode: constants_1.HTTP_STATUS.NOT_FOUND,
            };
        }
        if (admin.adminLevel = "super_admin")
            throw { message: "super admins cannot be suspended", statusCode: constants_1.HTTP_STATUS.BAD_REQUEST };
        if (action == "suspend") {
            admin.status = "suspended";
            admin.suspendedBy = suspendedBy;
            await admin.save();
            await this.emailService.sendAccountSuspendedNotification(admin.email, reason);
            logger_1.default.info("Admin account suspended", {
                adminId,
                suspendedBy,
                // updatedFields: Object.keys(data),
            });
            return admin;
        }
        admin.status = "active";
        // admin.suspendedBy = suspendedBy;
        await admin.save();
        await this.emailService.sendAccountUnsuspendedNotification(admin.email);
        logger_1.default.info("Admin account unsuspended", {
            adminId,
            // suspendedBy,
            // updatedFields: Object.keys(data),
        });
        return admin;
    }
    async deactivateAdmin(adminId, deactivatedBy) {
        const admin = await AdminModel_1.Admin.findById(adminId);
        if (!admin) {
            throw {
                message: "Admin not found",
                statusCode: constants_1.HTTP_STATUS.NOT_FOUND,
            };
        }
        if (admin.adminLevel === "super_admin") {
            throw {
                message: "Cannot delete super admin account",
                statusCode: constants_1.HTTP_STATUS.FORBIDDEN,
            };
        }
        await AdminModel_1.Admin.findByIdAndDelete(adminId);
        logger_1.default.info("Admin account deleted", {
            adminId,
            deactivatedBy,
        });
    }
    async resetAdminPassword(adminId, resetBy) {
        const admin = await AdminModel_1.Admin.findById(adminId);
        if (!admin) {
            throw {
                message: "Admin not found",
                statusCode: constants_1.HTTP_STATUS.NOT_FOUND,
            };
        }
        const generatedPassword = (0, helpers_1.generatePasswordCrypto)();
        admin.password = generatedPassword;
        admin.updatedBy = resetBy;
        await admin.save();
        // Send password reset notification
        await this.emailService.sendPasswordResetConfirmation(admin.email, admin.firstName, generatedPassword);
        logger_1.default.info("Admin password reset", {
            adminId,
            resetBy,
        });
    }
    async getAdminStatistics() {
        const stats = await AdminModel_1.Admin.aggregate([
            {
                $group: {
                    _id: "$adminLevel",
                    count: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                    },
                    suspended: {
                        $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] },
                    },
                    deactivated: {
                        $sum: { $cond: [{ $eq: ["$status", "deactivated"] }, 1, 0] },
                    },
                },
            },
        ]);
        const totalStats = await AdminModel_1.Admin.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                    },
                    recentLogins: {
                        $sum: {
                            $cond: [
                                {
                                    $gte: [
                                        "$lastLogin",
                                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);
        return {
            byLevel: stats,
            overall: totalStats[0] || { total: 0, active: 0, recentLogins: 0 },
        };
    }
}
exports.AdminManagementService = AdminManagementService;
