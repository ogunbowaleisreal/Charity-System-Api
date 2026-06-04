"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRepository = void 0;
const AdminModel_1 = require("../../models/AdminModel");
class AdminRepository {
    // ============= ADMIN ROLE OPERATIONS =============
    async findById(id) {
        const admin = await AdminModel_1.Admin.findById(id).lean().exec();
        return admin;
    }
    async findByRole(roleId) {
        const admins = await AdminModel_1.Admin.find({ role: roleId })
            .select("email firstName lastName isActive createdAt")
            .lean()
            .exec();
        return admins;
    }
    async findByRoleWithPagination(roleName, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [admins, total] = await Promise.all([
            AdminModel_1.Admin.find({ adminLevel: roleName })
                .select("email firstName lastName isActive createdAt updatedAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            AdminModel_1.Admin.countDocuments({ adminLevel: roleName }),
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
    async updateRole(adminId, roleName, permission) {
        const updatedAdmin = await AdminModel_1.Admin.findByIdAndUpdate(adminId, {
            $set: {
                adminLevel: roleName?.toLowerCase(),
                permissions: permission,
                updatedAt: new Date(),
            },
        }, { new: true, runValidators: true })
            .lean()
            .exec();
        return updatedAdmin;
    }
    async findAdminsWithoutRole() {
        const admins = await AdminModel_1.Admin.find({
            $or: [{ role: { $exists: false } }, { role: null }],
        })
            .select("email firstName lastName isActive createdAt")
            .lean()
            .exec();
        return admins;
    }
    async getRoleDistribution() {
        const distribution = await AdminModel_1.Admin.aggregate([
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
    async bulkAssignRole(adminIds, roleId) {
        const result = await AdminModel_1.Admin.updateMany({ _id: { $in: adminIds } }, {
            $set: {
                role: roleId,
                updatedAt: new Date(),
            },
        });
        return result;
    }
    async bulkRemoveRole(adminIds) {
        const result = await AdminModel_1.Admin.updateMany({ _id: { $in: adminIds } }, {
            $unset: { role: 1 },
            $set: { updatedAt: new Date() },
        });
        return result;
    }
    // ============= ANALYTICS =============
    async getAdminRoleStats() {
        const [totalAdmins, adminsWithRoles, adminsWithoutRoles, roleStats] = await Promise.all([
            AdminModel_1.Admin.countDocuments(),
            AdminModel_1.Admin.countDocuments({ role: { $exists: true, $ne: null } }),
            AdminModel_1.Admin.countDocuments({
                $or: [{ role: { $exists: false } }, { role: null }],
            }),
            AdminModel_1.Admin.aggregate([
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
exports.AdminRepository = AdminRepository;
