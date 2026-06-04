"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const roleRepository_1 = require("../../repository/admin/roleRepository");
const constants_1 = require("../../utils/constants");
const admin_management_1 = require("../../types/admin.management");
const adminRepository_1 = require("../../repository/admin/adminRepository");
class RoleService {
    constructor() {
        this.roleRepository = new roleRepository_1.RoleRepository();
        this.adminRepository = new adminRepository_1.AdminRepository();
    }
    async getAllRoles(page = 1, limit = 10, filters = {}, sortBy = "createdAt", sortOrder = "desc") {
        return await this.roleRepository.findWithPagination(page, limit, filters, sortBy, sortOrder);
    }
    async getRoleById(id) {
        const role = await this.roleRepository.findById(id);
        if (!role) {
            return null;
        }
        return role;
    }
    async createRole(roleData) {
        // Check if role name already exists
        const existingRole = await this.roleRepository.findByName(roleData.name);
        if (existingRole) {
            const error = new Error("Role with this name already exists");
            error.statusCode = constants_1.HTTP_STATUS.CONFLICT;
            throw error;
        }
        const newRole = await this.roleRepository.create({
            ...roleData,
        });
        return newRole;
    }
    async updateRole(id, updateData) {
        // Check if role exists
        const existingRole = await this.roleRepository.findById(id);
        if (!existingRole) {
            return null;
        }
        // Check if new name already exists (if name is being updated)
        if (updateData.name && updateData.name !== existingRole.name) {
            const roleWithNewName = await this.roleRepository.findByName(updateData.name);
            if (roleWithNewName && roleWithNewName._id.toString() !== id) {
                const error = new Error("Role with this name already exists");
                error.statusCode = constants_1.HTTP_STATUS.CONFLICT;
                throw error;
            }
        }
        const updatedRole = await this.roleRepository.update(id, updateData);
        return updatedRole;
    }
    async deleteRole(id) {
        const role = await this.roleRepository.findById(id);
        if (!role) {
            const error = new Error("Role not found");
            error.statusCode = constants_1.HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        // Check if role is assigned to any users
        const usersWithRole = await this.adminRepository.findByRole(id);
        if (usersWithRole && usersWithRole.length > 0) {
            const error = new Error("Cannot delete role that is assigned to admin user. Remove role from admin user first.");
            error.statusCode = constants_1.HTTP_STATUS.CONFLICT;
            throw error;
        }
        await this.roleRepository.delete(id);
    }
    async getAvailablePermissions() {
        const categories = admin_management_1.ADMIN_PERMISSIONS;
        const allPermissions = this.extractAllPermissions(categories);
        return {
            categories,
            allPermissions,
        };
    }
    async updateRolePermissions(id, permissions) {
        const role = await this.roleRepository.findById(id);
        if (!role) {
            return null;
        }
        const updatedRole = await this.roleRepository.update(id, {
            permissions,
        });
        return updatedRole;
    }
    // ============= ROLE ASSIGNMENT =============
    async assignRole(adminId, roleId) {
        // Check if admin exists
        const admin = await this.adminRepository.findById(adminId);
        if (!admin) {
            const error = new Error("Admin not found");
            error.statusCode = constants_1.HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        // Check if role exists
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            const error = new Error("Role not found");
            error.statusCode = constants_1.HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        // Check if admin already has this role
        if (admin.adminLevel && admin.adminLevel.toString() === role.name) {
            const error = new Error("Admin already has this role");
            error.statusCode = constants_1.HTTP_STATUS.CONFLICT;
            throw error;
        }
        // Assign role to admin
        const updatedAdmin = await this.adminRepository.updateRole(adminId, role.name, role.permissions);
        return {
            admin: updatedAdmin,
            role: role,
            message: `Role '${role.name}' assigned to admin '${admin.email}'`,
        };
    }
    async revokeRole(adminId, roleId) {
        // Check if admin exists
        const admin = await this.adminRepository.findById(adminId);
        if (!admin) {
            const error = new Error("Admin not found");
            error.statusCode = constants_1.HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            const error = new Error("Role not found");
            error.statusCode = constants_1.HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        // Check if admin has this role
        if (!admin.adminLevel || admin.adminLevel.toString() !== role.name) {
            const error = new Error("Admin does not have this role");
            error.statusCode = constants_1.HTTP_STATUS.CONFLICT;
            throw error;
        }
        // Remove role from admin
        const updatedAdmin = await this.adminRepository.updateRole(adminId, "revoked", []);
        return {
            admin: updatedAdmin,
            message: `Role '${role?.name || "Unknown"}' revoked from admin '${admin.email}'`,
        };
    }
    async getUsersByRole(roleId, page = 1, limit = 10) {
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            const error = new Error("Role not found");
            error.statusCode = constants_1.HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        const users = await this.adminRepository.findByRoleWithPagination(role.name, page, limit);
        return {
            role: role,
            users: users,
        };
    }
    extractAllPermissions(permissionObj) {
        const permissions = [];
        function traverse(obj) {
            for (const key in obj) {
                if (typeof obj[key] === "string") {
                    permissions.push(obj[key]);
                }
                else if (typeof obj[key] === "object") {
                    traverse(obj[key]);
                }
            }
        }
        traverse(permissionObj);
        return permissions;
    }
}
exports.RoleService = RoleService;
