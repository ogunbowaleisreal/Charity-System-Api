import { Response, Request, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.utils";
import { clientJwtPayload } from "../types/clientAuth";
import jwtUtil from "../utils/jwt";
import { JWTPayload } from "../types/auth";


export interface AuthenticatedRequest extends Request {
    user?: any;
}

export const verifyJwt = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(' ')[1];
    try {
        //const decoded = verifyAccessToken(token);
        const decoded = jwtUtil.verifyAccessToken(token)
        if (!decoded) {
            return res.status(401).json({ message: "Invalid token" });
        }
        req.user = decoded as JWTPayload;
        return next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}