import { Admin } from "../../models/AdminModel";
import { IAdmin } from "../../types/admin.management";
import { LeanOptions } from "mongoose";
import { Schema, Document } from "mongoose";

type Lean<T> = Omit<T, keyof Document>; // Remove Document methods


export class AdminRepository {
    // ============= ADMIN ROLE OPERATIONS =============
    async findById(id: string): Promise<Lean<IAdmin> | null> {
        const admin = await Admin.findById(id).lean().exec();
        return admin;
    }

    async findByRole(roleId: string): Promise<Lean<IAdmin>[]> {
        const admins = await Admin.find({ role: roleId })
            .select("email firstName lastName isActive createdAt")
            .lean()
            .exec();
        return admins;
    }

    async findByRoleWithPagination(
        roleName: string,
        page: number = 1,
        limit: number = 10
    ) {
        const skip = (page - 1) * limit;

        const [admins, total] = await Promise.all([
            Admin.find({ adminLevel: roleName })
                .select("email firstName lastName isActive createdAt updatedAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            Admin.countDocuments({ adminLevel: roleName }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            admins,
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

    async updateRole(
        adminId: string,
        roleName: string | null,
        permission: string[] | null
    ): Promise<Lean<IAdmin> | null> {
        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminId,
            {
                $set: {
                    adminLevel: roleName?.toLowerCase(),
                    permissions: permission,
                    updatedAt: new Date(),
                },
            },
            { new: true, runValidators: true }
        )
            .lean()
            .exec();

        return updatedAdmin;
    }

    async findAdminsWithoutRole(): Promise<Lean<IAdmin>[]> {
        const admins = await Admin.find({
            $or: [{ role: { $exists: false } }, { role: null }],
        })
            .select("email firstName lastName isActive createdAt")
            .lean()
            .exec();
        return admins;
    }

    async getRoleDistribution(): Promise<any[]> {
        const distribution = await Admin.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 },
                    admins: {
                        $push: {
                            id: "$_id",
                            email: "$email",
                            firstName: "$firstName",
                            lastName: "$lastName",
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "_id",
                    foreignField: "_id",
                    as: "roleDetails",
                },
            },
            {
                $project: {
                    roleId: "$_id",
                    roleName: { $arrayElemAt: ["$roleDetails.name", 0] },
                    roleDescription: { $arrayElemAt: ["$roleDetails.description", 0] },
                    adminCount: "$count",
                    admins: "$admins",
                },
            },
            {
                $sort: { adminCount: -1 },
            },
        ]);

        return distribution;
    }

    // ============= BULK OPERATIONS =============
    async bulkAssignRole(adminIds: string[], roleId: string): Promise<any> {
        const result = await Admin.updateMany(
            { _id: { $in: adminIds } },
            {
                $set: {
                    role: roleId,
                    updatedAt: new Date(),
                },
            }
        );

        return result;
    }

    async bulkRemoveRole(adminIds: string[]): Promise<any> {
        const result = await Admin.updateMany(
            { _id: { $in: adminIds } },
            {
                $unset: { role: 1 },
                $set: { updatedAt: new Date() },
            }
        );

        return result;
    }

    // ============= ANALYTICS =============
    async getAdminRoleStats(): Promise<any> {
        const [totalAdmins, adminsWithRoles, adminsWithoutRoles, roleStats] =
            await Promise.all([
                Admin.countDocuments(),
                Admin.countDocuments({ role: { $exists: true, $ne: null } }),
                Admin.countDocuments({
                    $or: [{ role: { $exists: false } }, { role: null }],
                }),
                Admin.aggregate([
                    {
                        $match: { role: { $exists: true, $ne: null } },
                    },
                    {
                        $group: {
                            _id: "$role",
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $lookup: {
                            from: "roles",
                            localField: "_id",
                            foreignField: "_id",
                            as: "roleInfo",
                        },
                    },
                    {
                        $project: {
                            roleName: { $arrayElemAt: ["$roleInfo.name", 0] },
                            adminCount: "$count",
                        },
                    },
                    {
                        $sort: { adminCount: -1 },
                    },
                ]),
            ]);

        return {
            totalAdmins,
            adminsWithRoles,
            adminsWithoutRoles,
            roleDistribution: roleStats,
        };
    }
}
