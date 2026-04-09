import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.utils";

export interface AdminRequest extends Request {
    admin: {
        adminId: string;
        role: {
            _id: string;
            name: string;
            permissions: string[];
        }
    };
}

export const verifyAdmin = (req: AdminRequest, res: Response, next: NextFunction) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
        return res.status(401).json({ message: "No access token provided" });
    }
    try {
        const decoded = verifyAccessToken(accessToken);
        if (decoded && typeof decoded === 'object' && decoded.role === 'admin' ||
            decoded && typeof decoded === 'object' && decoded.role === 'superadmin' ||
            decoded && typeof decoded === 'object' && decoded.role === 'moderator') {
            req.admin = {
                adminId: (decoded as any).admin_id,
                role: (decoded as any).role
            };
            next();
        } else {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }
    } catch (err) {
        return res.status(403).json({ message: "Invalid access token" });
    }
}