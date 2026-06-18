import { Response, NextFunction } from "express";
import { sendSuccessResponse } from "../../utils/helpers";
import logger from "../../logger";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import subscriberService from "../../services/Subscribers.services";

export class SubscriberController {

    async subscribe(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { email } = req.body;

            const result =
                await subscriberService.subscribe(
                    email
                );

            return sendSuccessResponse(
                res,
                result,
                "subscribed successfully"
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async unsubscribe(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { email } = req.body;

            const result =
                await subscriberService.unsubscribe(
                    email
                );

            return sendSuccessResponse(
                res,
                result,
                "unsubscribed successfully"
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }
}