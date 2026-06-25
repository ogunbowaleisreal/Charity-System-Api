import { Request, Response, NextFunction } from "express";
//import { AppleAuthService } from "../../services/client/googleAuth.service";
import { AppleAuthService } from "../../services/client/appleAuth.services";
import { authService } from "../../services/client/Auth.services";
import logger from "../../logger";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";

const appleService = new AppleAuthService();
const authservice = new authService();

export class AppleAuthController {
    async appleLogin(req: Request, res: Response, next: NextFunction) {
        try {
            const { idToken } = req.body;

            if (!idToken) {
                return res
                    .status(400)
                    .json({ message: "Google ID token is required" });
            }

            /**
             * Delegate login logic to service
             */
            const { user, tokens } =
                await appleService.loginWithApple(
                    idToken,
                    req.ip,
                    req.headers["user-agent"]
                );

            /**
             * Reuse existing formatter for consistency
             */
            const response =
                await authservice["formatLoginResponse"](user, tokens);

            return res.status(200).json({
                message: "Google login successful",
                response,
            });
        } catch (err: any) {
            logger.error(err.message)
            sendErrorResponse(res, err.message, err.statusCode)
            //  next(err);
        }
    }
}