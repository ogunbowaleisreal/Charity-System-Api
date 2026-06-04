"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../modulealias");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../logger"));
const dotenv_1 = __importDefault(require("dotenv"));
const Role_1 = require("../models/Role");
const admin_management_1 = require("../types/admin.management");
dotenv_1.default.config();
const createSuperAdminRole = async () => {
    try {
        logger_1.default.info("🌱 Starting super admin role creation...");
        await mongoose_1.default.connect(process.env.ATLAS_DATABASE_URI);
        logger_1.default.info("✅ Connected to MongoDB");
        const allPermissions = Object.values(admin_management_1.ADMIN_PERMISSIONS).flatMap((category) => Object.values(category));
        logger_1.default.info(`📋 Found ${allPermissions.length} permissions to assign`);
        const existingRole = await Role_1.Role.findOne({ name: "super_admin" });
        if (existingRole) {
            logger_1.default.info("⚠️  Super admin role already exists. Updating permissions...");
            existingRole.permissions = allPermissions;
            existingRole.updatedAt = new Date();
            await existingRole.save();
            logger_1.default.info("✅ Super admin role updated successfully");
            logger_1.default.info(`📊 Total permissions: ${existingRole.permissions.length}`);
        }
        else {
            const superAdminRole = new Role_1.Role({
                name: "super_admin",
                description: "Super administrator with full system access and all permissions",
                permissions: allPermissions,
            });
            await superAdminRole.save();
            logger_1.default.info("✅ Super admin role created successfully");
            logger_1.default.info(`📊 Total permissions assigned: ${superAdminRole.permissions.length}`);
        }
        logger_1.default.info("\n📋 Assigned Permissions by Category:");
        Object.entries(admin_management_1.ADMIN_PERMISSIONS).forEach(([categoryName, categoryPermissions]) => {
            logger_1.default.info(`\n${categoryName.toUpperCase()}:`);
            Object.values(categoryPermissions).forEach((permission) => {
                logger_1.default.info(`  ✓ ${permission}`);
            });
        });
        logger_1.default.info("\n🎉 Super admin role seeding completed successfully!");
    }
    catch (error) {
        logger_1.default.error("❌ Error creating super admin role:", error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        logger_1.default.info("📦 Database connection closed");
    }
};
createSuperAdminRole();
