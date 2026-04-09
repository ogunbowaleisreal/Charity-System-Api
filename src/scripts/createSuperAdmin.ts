import "../modulealias";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { Admin } from "../models/AdminModel";
import { ADMIN_PERMISSIONS } from "../types/admin.management";
import logger from "../logger";

const createSuperAdmin = async () => {
    try {
        logger.info("🚀 Starting Super Admin creation...");

        // Connect to database
        await mongoose.connect(process.env.ATLAS_DATABASE_URI!);
        logger.info("✅ Connected to database");

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
            throw new Error(
                "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be provided"
            );
        }

        // Create super admin data
        const superAdminData = {
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            adminLevel: "super_admin" as const,
            permissions: Object.values(ADMIN_PERMISSIONS).flatMap((category) =>
                Object.values(category)
            ),
            status: "active" as const,
        };

        // Create and save super admin
        const superAdmin = await Admin.createAdmin(superAdminData);

        logger.info("Super admin account created", {
            adminId: superAdmin._id.toString(),
            email: superAdmin.email,
            adminLevel: superAdmin.adminLevel,
        });
    } catch (error) {
        logger.error("Failed to create super admin", {
            error: (error as Error).message,
        });
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        logger.info("🔌 Disconnected from database");
        process.exit(0);
    }
};

createSuperAdmin();
