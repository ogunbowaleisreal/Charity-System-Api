"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleRepository = void 0;
const AdminModel_1 = __importDefault(require("../../models/AdminModel"));
const Role_1 = require("../../models/Role");
class RoleRepository {
    // ============= ROLE CRUD OPERATIONS =============
    async findWithPagination(page = 1, limit = 10, filters = {}, sortBy = "createdAt", sortOrder = "desc") {
        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === "asc" ? 1 : -1;
        const query = { isVisible: true };
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: "i" } },
                { description: { $regex: filters.search, $options: "i" } },
            ];
        }
        const [roles, total] = await Promise.all([
            Role_1.Role.find(query)
                .sort({ [sortBy]: sortDirection })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            Role_1.Role.countDocuments(query),
        ]);
        const roleNames = roles.map((role) => role.name.toLowerCase().trim());
        const totalAdminWithRoles = await AdminModel_1.default.aggregate([
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
        const roleUserCountMap = new Map();
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
    async findById(id) {
        return await Role_1.Role.findById(id).lean().exec();
    }
    async findByName(name) {
        return await Role_1.Role.findOne({
            name: name.toLowerCase().trim(),
        })
            .lean()
            .exec();
    }
    async findByIds(ids) {
        return await Role_1.Role.find({
            _id: { $in: ids },
        })
            .lean()
            .exec();
    }
    async create(roleData) {
        const role = new Role_1.Role({
            ...roleData,
            name: roleData.name.toLowerCase().trim(),
        });
        const savedRole = await role.save();
        return savedRole.toObject();
    }
    async update(id, updateData) {
        const updateFields = { ...updateData };
        if (updateFields.name) {
            updateFields.name = updateFields.name.toLowerCase().trim();
        }
        updateFields.updatedAt = new Date();
        return await Role_1.Role.findByIdAndUpdate(id, { $set: updateFields }, { new: true, runValidators: true })
            //     .lean()
            .exec();
    }
    async delete(id) {
        return await Role_1.Role.findByIdAndDelete(id).lean().exec();
    }
    // ============= ROLE PERMISSIONS =============
    async updatePermissions(id, permissions) {
        return await Role_1.Role.findByIdAndUpdate(id, {
            $set: {
                permissions: permissions,
                updatedAt: new Date(),
            },
        }, { new: true, runValidators: true })
            .lean()
            .exec();
    }
    async findRolesWithPermission(permission) {
        return await Role_1.Role.find({
            "permissions.name": permission,
        })
            .lean()
            .exec();
    }
    async getRoleStats() {
        const [totalRoles, rolesWithUsers] = await Promise.all([
            Role_1.Role.countDocuments(),
            Role_1.Role.aggregate([
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
    async getMostUsedRoles(limit = 5) {
        return await Role_1.Role.aggregate([
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
    async bulkUpdateRoles(updates) {
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
        return await Role_1.Role.bulkWrite(bulkOps);
    }
    async bulkDeleteRoles(ids) {
        return await Role_1.Role.deleteMany({
            _id: { $in: ids },
        });
    }
}
exports.RoleRepository = RoleRepository;
