import { RoleRepository } from "../../repository/admin/roleRepository";
import { IRole } from "../../models/Role";
import { HTTP_STATUS } from "../../utils/constants";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { AdminRepository } from "../../repository/admin/adminRepository";
import { Schema, Document } from "mongoose";

type Lean<T> = Omit<T, keyof Document>; // Remove Document methods


export interface IRoleFilters {
    search?: string;
}

export interface ICreateRoleData {
    name: string;
    description: string;
    permissions: String[];
}

export interface IUpdateRoleData {
    name?: string;
    description?: string;
    permissions?: String[];
}

export class RoleService {
    private roleRepository = new RoleRepository();
    private adminRepository = new AdminRepository();

    async getAllRoles(
        page: number = 1,
        limit: number = 10,
        filters: IRoleFilters = {},
        sortBy: string = "createdAt",
        sortOrder: "asc" | "desc" = "desc"
    ) {
        return await this.roleRepository.findWithPagination(
            page,
            limit,
            filters,
            sortBy,
            sortOrder
        );
    }

    async getRoleById(id: string): Promise<Lean<IRole> | null> {
        const role = await this.roleRepository.findById(id);
        if (!role) {
            return null;
        }
        return role;
    }

    async createRole(roleData: ICreateRoleData): Promise<IRole> {
        // Check if role name already exists
        const existingRole = await this.roleRepository.findByName(roleData.name);
        if (existingRole) {
            const error = new Error("Role with this name already exists");
            (error as any).statusCode = HTTP_STATUS.CONFLICT;
            throw error;
        }

        const newRole = await this.roleRepository.create({
            ...roleData,
        });

        return newRole;
    }

    async updateRole(
        id: string,
        updateData: IUpdateRoleData
    ): Promise<IRole | null> {
        // Check if role exists
        const existingRole = await this.roleRepository.findById(id);
        if (!existingRole) {
            return null;
        }


        // Check if new name already exists (if name is being updated)
        if (updateData.name && updateData.name !== existingRole.name) {
            const roleWithNewName = await this.roleRepository.findByName(
                updateData.name
            ) as any;
            if (roleWithNewName && roleWithNewName._id.toString() !== id) {
                const error = new Error("Role with this name already exists");
                (error as any).statusCode = HTTP_STATUS.CONFLICT;
                throw error;
            }
        }

        const updatedRole = await this.roleRepository.update(id, updateData);
        return updatedRole;
    }

    async deleteRole(id: string): Promise<void> {
        const role = await this.roleRepository.findById(id);
        if (!role) {
            const error = new Error("Role not found");
            (error as any).statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }


        // Check if role is assigned to any users
        const usersWithRole = await this.adminRepository.findByRole(id);
        if (usersWithRole && usersWithRole.length > 0) {
            const error = new Error(
                "Cannot delete role that is assigned to admin user. Remove role from admin user first."
            );
            (error as any).statusCode = HTTP_STATUS.CONFLICT;
            throw error;
        }

        await this.roleRepository.delete(id);
    }

    async getAvailablePermissions(): Promise<{
        categories: Record<string, any>;
        allPermissions: string[];
    }> {
        const categories = ADMIN_PERMISSIONS;
        const allPermissions = this.extractAllPermissions(categories);

        return {
            categories,
            allPermissions,
        };
    }

    async updateRolePermissions(
        id: string,
        permissions: String[]
    ): Promise<IRole | null> {
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
    async assignRole(adminId: string, roleId: string) {
        // Check if admin exists
        const admin = await this.adminRepository.findById(adminId);
        if (!admin) {
            const error = new Error("Admin not found");
            (error as any).statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        // Check if role exists
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            const error = new Error("Role not found");
            (error as any).statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        // Check if admin already has this role
        if (admin.adminLevel && admin.adminLevel.toString() === role.name) {
            const error = new Error("Admin already has this role");
            (error as any).statusCode = HTTP_STATUS.CONFLICT;
            throw error;
        }

        // Assign role to admin
        const updatedAdmin = await this.adminRepository.updateRole(
            adminId,
            role.name,
            role.permissions
        );

        return {
            admin: updatedAdmin,
            role: role,
            message: `Role '${role.name}' assigned to admin '${admin.email}'`,
        };
    }

    async revokeRole(adminId: string, roleId: string) {
        // Check if admin exists
        const admin = await this.adminRepository.findById(adminId);
        if (!admin) {
            const error = new Error("Admin not found");
            (error as any).statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            const error = new Error("Role not found");
            (error as any).statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        // Check if admin has this role
        if (!admin.adminLevel || admin.adminLevel.toString() !== role.name) {
            const error = new Error("Admin does not have this role");
            (error as any).statusCode = HTTP_STATUS.CONFLICT;
            throw error;
        }

        // Remove role from admin
        const updatedAdmin = await this.adminRepository.updateRole(
            adminId,
            "revoked",
            []
        );

        return {
            admin: updatedAdmin,
            message: `Role '${role?.name || "Unknown"}' revoked from admin '${admin.email
                }'`,
        };
    }

    async getUsersByRole(roleId: string, page: number = 1, limit: number = 10) {
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            const error = new Error("Role not found");
            (error as any).statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        const users = await this.adminRepository.findByRoleWithPagination(
            role.name,
            page,
            limit
        );

        return {
            role: role,
            users: users,
        };
    }


    private extractAllPermissions(permissionObj: any): string[] {
        const permissions: string[] = [];

        function traverse(obj: any) {
            for (const key in obj) {
                if (typeof obj[key] === "string") {
                    permissions.push(obj[key]);
                } else if (typeof obj[key] === "object") {
                    traverse(obj[key]);
                }
            }
        }

        traverse(permissionObj);
        return permissions;
    }
}
