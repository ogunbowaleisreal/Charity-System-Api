"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdmin = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
const verifyAdmin = (req, res, next) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
        return res.status(401).json({ message: "No access token provided" });
    }
    try {
        const decoded = (0, jwt_utils_1.verifyAccessToken)(accessToken);
        if (decoded && typeof decoded === 'object' && decoded.role === 'admin' ||
            decoded && typeof decoded === 'object' && decoded.role === 'superadmin' ||
            decoded && typeof decoded === 'object' && decoded.role === 'moderator') {
            req.admin = {
                adminId: decoded.admin_id,
                role: decoded.role
            };
            next();
        }
        else {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }
    }
    catch (err) {
        return res.status(403).json({ message: "Invalid access token" });
    }
};
exports.verifyAdmin = verifyAdmin;
