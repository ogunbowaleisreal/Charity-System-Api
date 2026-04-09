import Admin from "../../models/AdminModel";
import { Role, IRole } from "../../models/Role";
import { Schema, Document } from "mongoose";
import {
    IRoleFilters,
    ICreateRoleData,
    IUpdateRoleData,
} from "../../services/admin/roleService";

type Lean<T> = Omit<T, keyof Document>; // Remove Document methods

export class RoleRepository {
    // ============= ROLE CRUD OPERATIONS =============

    async findWithPagination(
        page: number = 1,
        limit: number = 10,
        filters: IRoleFilters = {},
        sortBy: string = "createdAt",
        sortOrder: "asc" | "desc" = "desc"
    ) {
        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === "asc" ? 1 : -1;

        const query: any = { isVisible: true };

        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: "i" } },
                { description: { $regex: filters.search, $options: "i" } },
            ];
        }

        const [roles, total] = await Promise.all([
            Role.find(query)
                .sort({ [sortBy]: sortDirection })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            Role.countDocuments(query),
        ]);

        const roleNames = roles.map((role) => role.name.toLowerCase().trim());

        const totalAdminWithRoles = await Admin.aggregate([
            {
                $match: {
                    status: "active",
                    $expr: {
                        $in: [{ $toLower: { $trim: { input: "$adminLevel" } } }, roleNames],
                    },
                },
            },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: "$adminLevel" } } },
                    adminCount: { $sum: 1 },
                },
            },
        ]).exec();

        const roleUserCountMap = new Map<string, number>();
        totalAdminWithRoles.forEach((item) => {
            roleUserCountMap.set(item._id, item.adminCount);
        });

        const data = roles.map((role) => ({
            ...role,
            adminCount: roleUserCountMap.get(role.name.toLowerCase().trim()) || 0,
        }));

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                per_page: limit,
                total_records: total,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            },
        };
    }

    async findById(id: string): Promise<Lean<IRole> | null> {
        return await Role.findById(id).lean().exec();
    }

    async findByName(name: string): Promise<Lean<IRole> | null> {
        return await Role.findOne({
            name: name.toLowerCase().trim(),
        })
            .lean()
            .exec();
    }

    async findByIds(ids: string[]): Promise<Lean<IRole>[]> {
        return await Role.find({
            _id: { $in: ids },
        })
            .lean()
            .exec();
    }

    async create(roleData: ICreateRoleData): Promise<IRole> {
        const role = new Role({
            ...roleData,
            name: roleData.name.toLowerCase().trim(),
        });
        const savedRole = await role.save();
        return savedRole.toObject();
    }

    async update(id: string, updateData: IUpdateRoleData): Promise<IRole | null> {
        const updateFields: any = { ...updateData };

        if (updateFields.name) {
            updateFields.name = updateFields.name.toLowerCase().trim();
        }

        updateFields.updatedAt = new Date();

        return await Role.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        )
            //     .lean()
            .exec();
    }

    async delete(id: string): Promise<Lean<IRole> | null> {
        return await Role.findByIdAndDelete(id).lean().exec();
    }

    // ============= ROLE PERMISSIONS =============
    async updatePermissions(
        id: string,
        permissions: any[]
    ): Promise<Lean<IRole> | null> {
        return await Role.findByIdAndUpdate(
            id,
            {
                $set: {
                    permissions: permissions,
                    updatedAt: new Date(),
                },
            },
            { new: true, runValidators: true }
        )
            .lean()
            .exec();
    }

    async findRolesWithPermission(permission: string): Promise<Lean<IRole>[]> {
        return await Role.find({
            "permissions.name": permission,
        })
            .lean()
            .exec();
    }

    async getRoleStats(): Promise<any> {
        const [totalRoles, rolesWithUsers] = await Promise.all([
            Role.countDocuments(),
            Role.aggregate([
                {
                    $lookup: {
                        from: "admins",
                        localField: "_id",
                        foreignField: "role",
                        as: "users",
                    },
                },
                {
                    $project: {
                        name: 1,
                        userCount: { $size: "$users" },
                    },
                },
            ]),
        ]);

        return {
            totalRoles,
            rolesWithUsers,
        };
    }

    async getMostUsedRoles(limit: number = 5): Promise<any[]> {
        return await Role.aggregate([
            {
                $lookup: {
                    from: "admins",
                    localField: "_id",
                    foreignField: "role",
                    as: "users",
                },
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    userCount: { $size: "$users" },
                },
            },
            {
                $sort: { userCount: -1 },
            },
            {
                $limit: limit,
            },
        ]);
    }

    // ============= BULK OPERATIONS =============
    async bulkUpdateRoles(
        updates: Array<{ id: string; data: IUpdateRoleData }>
    ): Promise<any> {
        const bulkOps = updates.map(({ id, data }) => ({
            updateOne: {
                filter: { _id: id },
                update: {
                    $set: {
                        ...data,
                        updatedAt: new Date(),
                    },
                },
            },
        }));

        return await Role.bulkWrite(bulkOps);
    }

    async bulkDeleteRoles(ids: string[]): Promise<any> {
        return await Role.deleteMany({
            _id: { $in: ids },
        });
    }
}
