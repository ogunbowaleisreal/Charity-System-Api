import jwt, { SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { JWTPayload, RefreshTokenPayload, TokenPair } from "../types/auth";

interface JWTConfig {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
    resetSecret: string;
}

class JWTUtil {
    private config: JWTConfig;

    constructor() {
        this.config = {
            accessSecret: process.env.JWT_ACCESS_SECRET || "your-access-secret",
            refreshSecret: process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
            accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "5h",
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
            resetSecret: "ushrutr7978g8avuv98e-9w8us7%huhdusfs",
        };
    }

    generateResetToken(email: string): string {
        const jwtPayload = {
            email: email,
            type: "password-reset",
        };

        return jwt.sign(jwtPayload, this.config.resetSecret, {
            expiresIn: "10m",
            issuer: "pelbliss-marketplace",
            audience: "pelbliss-marketplace-client",
        } as jwt.SignOptions);
    }

    verifyResetToken(token: string) {
        try {
            const decoded: any = jwt.verify(token, this.config.resetSecret);

            if (decoded.type !== "password-reset") {
                throw new Error("INVALID_TOKEN_TYPE");
            }
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error("Your reset link has expired. Please request a new one.");
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error("ACCESS_TOKEN_INVALID");
            }
            throw new Error("ACCESS_TOKEN_VERIFICATION_FAILED");
        }
    }

    generateAccessToken(payload: {
        userId: string;
        email: string;
        role: string;
        permissions?: string[];
    }): string {
        const jwtPayload: JWTPayload = {
            id: payload.userId,
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
        };

        return jwt.sign(jwtPayload, this.config.accessSecret, {
            expiresIn: this.config.accessExpiresIn as string,
            issuer: "floatthr-solutions",
            audience: "floattht-solutions",
        } as jwt.SignOptions);
    }

    generateRefreshToken(payload: { userId: string; deviceInfo?: string }): {
        token: string;
        tokenId: string;
    } {
        const tokenId = uuidv4();

        const refreshPayload: RefreshTokenPayload = {
            userId: payload.userId,
            tokenId,
            deviceInfo: payload.deviceInfo,
        };

        const token = jwt.sign(refreshPayload, this.config.refreshSecret, {
            expiresIn: this.config.refreshExpiresIn ?? "7d",
            issuer: "floatthr-solutions",
            audience: "floatthr-solutions-refresh",
        } as jwt.SignOptions);

        return { token, tokenId };
    }

    generateTokenPair(payload: {
        userId: string;
        email: string;
        role: string;
        adminLevel?: string;
        permissions?: string[];
        deviceInfo?: string;
    }): TokenPair & { tokenId: string } {
        const accessToken = this.generateAccessToken({
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            ...(payload.adminLevel != undefined && {
                adminLevel: payload.adminLevel,
            }),
            ...(payload.permissions != undefined && {
                permissions: payload.permissions,
            }),
        });

        const { token: refreshToken, tokenId } = this.generateRefreshToken({
            userId: payload.userId,
            ...(payload.deviceInfo && { deviceInfo: payload.deviceInfo }),
        });

        // Calculate expiration time in seconds
        const expiresIn = this.getTokenExpirationTime(this.config.accessExpiresIn);

        return {
            accessToken,
            refreshToken,
            tokenId,
            expiresIn,
        };
    }

    verifyAccessToken(token: string): JWTPayload {
        try {
            const decoded = jwt.verify(token, this.config.accessSecret) as JWTPayload;
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error("ACCESS_TOKEN_EXPIRED");
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error("ACCESS_TOKEN_INVALID");
            }
            throw new Error("ACCESS_TOKEN_VERIFICATION_FAILED");
        }
    }

    verifyRefreshToken(token: string): RefreshTokenPayload {
        try {
            const decoded = jwt.verify(
                token,
                this.config.refreshSecret
            ) as RefreshTokenPayload;
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error("REFRESH_TOKEN_EXPIRED");
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error("REFRESH_TOKEN_INVALID");
            }
            throw new Error("REFRESH_TOKEN_VERIFICATION_FAILED");
        }
    }

    decodeToken(token: string): any {
        try {
            return jwt.decode(token);
        } catch (error) {
            return null;
        }
    }

    extractTokenFromHeader(authHeader: string | undefined): string | null {
        if (!authHeader) return null;

        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") return null;

        return parts[1];
    }

    private getTokenExpirationTime(expiresIn: string): number {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) return 1800; // Default 30 minutes

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case "s":
                return value;
            case "m":
                return value * 60;
            case "h":
                return value * 60 * 60;
            case "d":
                return value * 24 * 60 * 60;
            default:
                return 1800;
        }
    }

    isTokenExpired(token: string): boolean {
        try {
            const decoded: any = jwt.decode(token);
            if (!decoded || !decoded.exp) return true;

            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (error) {
            return true;
        }
    }

    getTimeUntilExpiration(token: string): number {
        try {
            const decoded: any = jwt.decode(token);
            if (!decoded || !decoded.exp) return 0;

            const currentTime = Math.floor(Date.now() / 1000);
            return Math.max(0, decoded.exp - currentTime);
        } catch (error) {
            return 0;
        }
    }
}

export const jwtUtil = new JWTUtil();
export default jwtUtil;
