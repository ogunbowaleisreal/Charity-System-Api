import "../modulealias";
import mongoose from "mongoose";
import logger from "../logger";
import dotenv from "dotenv";
import { Role } from "../models/Role";
import { ADMIN_PERMISSIONS } from "../types/admin.management";
dotenv.config();

const createSuperAdminRole = async () => {
    try {
        logger.info("🌱 Starting super admin role creation...");

        await mongoose.connect(process.env.ATLAS_DATABASE_URI!);
        logger.info("✅ Connected to MongoDB");

        const allPermissions = Object.values(ADMIN_PERMISSIONS).flatMap(
            (category) => Object.values(category)
        );

        logger.info(`📋 Found ${allPermissions.length} permissions to assign`);

        const existingRole = await Role.findOne({ name: "super_admin" });

        if (existingRole) {
            logger.info(
                "⚠️  Super admin role already exists. Updating permissions..."
            );

            existingRole.permissions = allPermissions;
            existingRole.updatedAt = new Date();
            await existingRole.save();

            logger.info("✅ Super admin role updated successfully");
            logger.info(`📊 Total permissions: ${existingRole.permissions.length}`);
        } else {
            const superAdminRole = new Role({
                name: "super_admin",
                description:
                    "Super administrator with full system access and all permissions",
                permissions: allPermissions,
            });

            await superAdminRole.save();

            logger.info("✅ Super admin role created successfully");
            logger.info(
                `📊 Total permissions assigned: ${superAdminRole.permissions.length}`
            );
        }

        logger.info("\n📋 Assigned Permissions by Category:");

        Object.entries(ADMIN_PERMISSIONS).forEach(
            ([categoryName, categoryPermissions]) => {
                logger.info(`\n${categoryName.toUpperCase()}:`);
                Object.values(categoryPermissions).forEach((permission) => {
                    logger.info(`  ✓ ${permission}`);
                });
            }
        );

        logger.info("\n🎉 Super admin role seeding completed successfully!");
    } catch (error) {
        logger.error("❌ Error creating super admin role:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        logger.info("📦 Database connection closed");
    }
};

createSuperAdminRole();
