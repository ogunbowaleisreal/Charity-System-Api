import { Request, Response } from "express";
import { NextFunction } from "express";
import { webhookServices } from "../../services/client/webhook.services";
import logger from "../../logger";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES, HTTP_STATUS } from "../../utils/constants";

const webhookService = new webhookServices();
export class WebhookController {
    async handleWebhook(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const signature = req.headers["x-safehaven-signature"] as string;
            res.status(200).send('OK');
            console.log(`signature ${signature}`);

            // Optional: Validate webhook signature
            // const signature = req.headers["x-safehaven-signature"] as string;
            const secret = process.env.SAFEHAVEN_WEBHOOK_SECRET || "";
            if (!webhookService.validateSafehavenSignature(JSON.stringify(req.body), signature, secret)) {
                logger.warn("SafeHaven webhook invalid signature");

                console.log("signature verification failed")
                // throw new AppError(
                //     "Invalid signature",
                //     HTTP_STATUS.UNAUTHORIZED,
                //     ERROR_CODES.UNAUTHORIZED
                // );
            }

            await webhookService.handleSafeHavenWebhook(req.body, signature);

            // IMPORTANT: Always return 200 quickly
            return res.status(200).json({ received: true });
        } catch (error: any) {
            logger.error("Webhook error:", error);

            // Never expose error to SafeHaven
            return res.status(200).json({ received: true });
        }
    }

    async handleFlutterWaveWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            console.log("flutterwave webhook")


            // const signature = req.headers["flutterwave-signature"] as string;
            const flutterwaveSignature = req.headers["verif-hash"] as string;
            const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET || "";
            if (!webhookService.verifyFlutterwaveWebhook(flutterwaveSignature, secret)) {
                logger.warn("Flutterwave webhook invalid signature");
                throw new AppError(
                    "Invalid signature",
                    HTTP_STATUS.UNAUTHORIZED,
                    ERROR_CODES.UNAUTHORIZED
                );
            }
            res.status(200).send('OK');

            await webhookService.handleFlutterwaveWebhook(req.body);
            // return res.status(200).json({ received: true });
        } catch (err: any) {
            logger.error("Webhook error", err);
            // return res.status(err.status || 500).json({
            //     message: err.message || "Webhook error",
            // });
        }
    }
}