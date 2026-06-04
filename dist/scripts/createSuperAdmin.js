"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../modulealias");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const AdminModel_1 = require("../models/AdminModel");
const admin_management_1 = require("../types/admin.management");
const logger_1 = __importDefault(require("../logger"));
const createSuperAdmin = async () => {
    try {
        logger_1.default.info("🚀 Starting Super Admin creation...");
        // Connect to database
        await mongoose_1.default.connect(process.env.ATLAS_DATABASE_URI);
        logger_1.default.info("✅ Connected to database");
        // Check if super admin already exists
        // const existingSuperAdmin = await Admin.findOne({
        //     adminLevel: "super_admin",
        // });
        // if (existingSuperAdmin) {
        //     logger.info("⚠️  Super admin already exists:", existingSuperAdmin.email);
        //     return;
        // }
        // Get credentials from environment or use defaults
        const email = process.env.SUPER_ADMIN_EMAIL || "superadmin@yourapp.com";
        const password = process.env.SUPER_ADMIN_PASSWORD || "SuperSecure@123";
        const firstName = process.env.SUPER_ADMIN_FIRST_NAME || "Super";
        const lastName = process.env.SUPER_ADMIN_LAST_NAME || "Admin";
        // Validate required fields
        if (!email || !password) {
            throw new Error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be provided");
        }
        // Create super admin data
        const superAdminData = {
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            adminLevel: "super_admin",
            permissions: Object.values(admin_management_1.ADMIN_PERMISSIONS).flatMap((category) => Object.values(category)),
            status: "active",
        };
        // Create and save super admin
        const superAdmin = await AdminModel_1.Admin.createAdmin(superAdminData);
        logger_1.default.info("Super admin account created", {
            adminId: superAdmin._id.toString(),
            email: superAdmin.email,
            adminLevel: superAdmin.adminLevel,
        });
    }
    catch (error) {
        logger_1.default.error("Failed to create super admin", {
            error: error.message,
        });
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        logger_1.default.info("🔌 Disconnected from database");
        process.exit(0);
    }
};
createSuperAdmin();
