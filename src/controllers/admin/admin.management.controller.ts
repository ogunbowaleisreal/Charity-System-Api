// import { Request, Response } from "express";
// import { adminManagementService } from "../../services/admin/admin.management.services";
// import { AdminRequest } from "../../middleware/verify.admin";
// import { error } from "console";

// const adminMngtService = new adminManagementService();
// export class adminManagementController {
//     // Example method for managing users
//     public createAdmin = async (req: AdminRequest, res: Response) => {
//         const { name, email, password, role } = req.body;
//         if (!name || !email || !password || !role) {
//             res.status(400).json({ message: "All fields are required" });
//             return;
//         }
//         const newAadmin = await adminMngtService.createAdmin(name, email, password, role, req.admin.adminId);
//         if (!newAadmin) {
//             res.status(500).json({ message: "Failed to create admin" });
//             return;
//         }
//         res.status(201).json({ message: "Admin created successfully", admin: newAadmin });
//     }

//     public assignRoleToAdmin = async (req: AdminRequest, res: Response) => {
//         const adminId = req.admin;
//         const roleId = req.admin.role._id

//         const updatedAdmin = await adminMngtService.assignRoleToAdmin(adminId.adminId, roleId.toString());
//         if (!updatedAdmin) {
//             res.status(500).json({ message: "Failed to assign role to admin" });
//             return;
//         }
//         res.status(200).json({ message: "Role assigned successfully", admin: updatedAdmin });
//     }
//     public getAdminById = async (req: Request, res: Response) => {
//         const adminId = req.params.id;
//         const admin = await adminMngtService.getAdminById(adminId);
//         if (!admin) {
//             return res.status(404).json({ message: "Admin not found" });
//         }
//     }

//     public getAllAdmins = async (req: Request, res: Response) => {
//         const admins = await adminMngtService.getAllAdmins();
//         if (!admins) {
//             return res.status(404).json({ message: "No admins found" });
//         }
//         return res.status(200).json({ admins });
//     }

//     public deactivateAdmin = async (req: Request, res: Response) => {
//         const adminId = req.params.adminId;
//         const deactivatedById = req.body.deactivatedById;
//         try {
//             const deactivatedAdmin = await adminMngtService.deactivateAdmin(adminId, deactivatedById);
//             return res.status(200).json({ message: "Admin deactivated successfully", admin: deactivatedAdmin });
//         } catch (error: any) {
//             return res.status(500).json({ message: "Failed to deactivate admin", error: error.message });
//         }
//     }

//     public updateAdminAdditonalPermissions = async (req: AdminRequest, res: Response) => {
//         const adminId = req.params.adminId;
//         const permissions = req.body.permissions;
//         const updatedById = req.admin.adminId

//         const updatedAdmin = await adminMngtService.updateAdminAdditionalPermissions(adminId, permissions, updatedById);
//         if (!updatedAdmin) {
//             res.status(500).json({ message: "Failed to update admin permissions" });
//             return;
//         }
//         res.status(200).json({ message: "Admin permissions updated successfully", admin: updatedAdmin });
//     }

//     public updateAdminDetails = async (req: AdminRequest, res: Response) => {
//         const adminId = req.params.adminId;
//         const updateData = req.body;
//         const updatedById = req.admin.adminId;

//         try {
//             const updatedAdmin = await adminMngtService.updateAdminDetails(adminId, updateData, updatedById);
//             return res.status(200).json({ message: "Admin details updated successfully", admin: updatedAdmin });
//         } catch (error: any) {
//             return res.status(500).json({ message: "Failed to update admin details", error: error.message });
//         }
//     }

//     // Logic for managing users goes here
// }
