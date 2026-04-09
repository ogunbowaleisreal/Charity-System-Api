// import { all } from "axios";
// import { Admin } from "../../models/admin";
// import Role from "../../models/Role";

// export class adminManagementService {

//     async assignRoleToAdmin(adminId: string, roleId: string) {
//         const admin = await Admin.findById(adminId);
//         if (!admin || !roles) {
//             throw new Error("Admin/Role not sent");
//         }
//         const role = await roles.findById(roleId);
//         if (!role) {
//             throw new Error("Role not found in db");
//         }
//         admin.role = role._id as any;
//         admin.permissions = role.permissions;
//         await admin.save();
//         return admin;
//     }

//     async createAdmin(name: string, email: string, password: string, roleId: string, adminCreatingId: string) {
//         const adminCreating = await Admin.findById(adminCreatingId).populate('role');
//         if (!adminCreating) {
//             throw new Error("Admin creating new admin not found");
//         }
//         if (adminCreating.adminLevel !== 'superadmin') {
//             throw new Error("Only superadmins can create new admins");
//         }
//         const role = await roles.findById(roleId);
//         if (!role) {
//             throw new Error("Role not found in db");
//         }
//         const newAdmin = new Admin({
//             name,
//             email,
//             password,
//             role: role._id,
//             adminLevel: role.name,
//         });
//         await newAdmin.save();
//         return newAdmin;
//     }

//     async getAllAdmins() {
//         const allAdmins = await Admin.find().populate('role');
//         if (!allAdmins) {
//             throw new Error("No admins found");
//         }
//         return allAdmins;
//     }

//     async getAdminById(adminId: string) {
//         const admin = await Admin.findById(adminId).populate('role');
//         if (!admin) {
//             throw new Error("Admin not found");
//         }
//         return admin;
//     }

//     async deactivateAdmin(adminId: string, deactivatedById: string) {
//         const admin = await Admin.findById(adminId);
//         const deactivatedBy = await Admin.findById(deactivatedById);
//         if (!deactivatedBy || deactivatedBy.adminLevel !== 'superadmin') {
//             throw new Error("Only superadmins can deactivate admins");
//         }
//         if (!admin) {
//             throw new Error("Admin not found");
//         }
//         if (admin.adminLevel === 'superadmin') {
//             throw new Error("Cannot deactivate a superadmin");
//         }
//         await Admin.findByIdAndDelete(adminId);
//         return true;
//     }

//     async updateAdminAdditionalPermissions(adminId: string, permissions: string[], updatedById: string) {
//         const admin = await Admin.findById(adminId);
//         const updatedBy = await Admin.findById(updatedById);
//         if (!updatedBy || updatedBy.adminLevel !== 'superadmin' || !admin || updatedById === adminId) {
//             throw new Error("Only superadmins can update additional permissions of other admins");
//         }
//         admin.additionalPermissions = permissions;
//         await admin.save();
//         return admin;
//     }

//     async updateAdminDetails(adminId: string, updatePayload: Partial<{ name: string; email: string; }>, updatedById: string) {
//         const admin = await Admin.findById(adminId);
//         if (!admin) {
//             throw new Error("Admin not found");
//         }
//         if (updatePayload.name !== undefined) {
//             admin.name = updatePayload.name;
//         }
//         if (updatePayload.email !== undefined) {
//             admin.email = updatePayload.email;
//         }
//     }
// }