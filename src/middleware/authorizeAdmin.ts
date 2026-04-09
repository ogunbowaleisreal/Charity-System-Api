// import { Response, NextFunction } from 'express';
// import { AdminRequest } from './verify.admin';
// import { Admin } from '../models/admin';
// export const authorizeAdmin = (requiredPermissions: string[]) => {
//     return async (req: AdminRequest, res: Response, next: NextFunction) => {
//         const adminPermissions = req.admin.role.permissions;
//         const adminId = req.admin.adminId;
//         const admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({ message: "Admin not found" });
//         }
//         const additionalPermissions = admin.additionalPermissions || [];
//         const allPermissions = [...adminPermissions, ...additionalPermissions];
//         const hasPermission = requiredPermissions.every(permission => allPermissions.includes(permission));
//         if (!hasPermission) {
//             return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
//         }
//         next();
//         return
//     }
// }