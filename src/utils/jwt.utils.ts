import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { randomString, hashToken } from './hash.utils';
import { clientJwtPayload } from '../types/clientAuth';


export const signAccessToken = (payload: any) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: '15m' });
}

export const signRefreshToken = () => {
    const plainRefreshToken = randomString(64)
    const hashedRefreshToken = hashToken(plainRefreshToken,);
    return { plainRefreshToken: plainRefreshToken, hashedRefreshToken: hashedRefreshToken };
}

export const verifyAccessToken = (token: string) => {
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
        if (typeof decoded === 'object') {
            return decoded;
        }
        return null;
    } catch (err) {
        return null;
    }
}



