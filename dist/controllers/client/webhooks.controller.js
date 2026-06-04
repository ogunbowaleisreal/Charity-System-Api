"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const webhook_services_1 = require("../../services/client/webhook.services");
const logger_1 = __importDefault(require("../../logger"));
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../utils/constants");
const webhookService = new webhook_services_1.webhookServices();
class WebhookController {
    async handleWebhook(req, res, next) {
        try {
            const signature = req.headers["x-safehaven-signature"];
            res.status(200).send('OK');
            console.log(`signature ${signature}`);
            // Optional: Validate webhook signature
            // const signature = req.headers["x-safehaven-signature"] as string;
            const secret = process.env.SAFEHAVEN_WEBHOOK_SECRET || "";
            if (!webhookService.validateSafehavenSignature(JSON.stringify(req.body), signature, secret)) {
                logger_1.default.warn("SafeHaven webhook invalid signature");
                console.log("signature verification failed");
                // throw new AppError(
                //     "Invalid signature",
                //     HTTP_STATUS.UNAUTHORIZED,
                //     ERROR_CODES.UNAUTHORIZED
                // );
            }
            await webhookService.handleSafeHavenWebhook(req.body, signature);
            // IMPORTANT: Always return 200 quickly
            return res.status(200).json({ received: true });
        }
        catch (error) {
            logger_1.default.error("Webhook error:", error);
            // Never expose error to SafeHaven
            return res.status(200).json({ received: true });
        }
    }
    async handleFlutterWaveWebhook(req, res, next) {
        try {
            console.log("flutterwave webhook");
            // const signature = req.headers["flutterwave-signature"] as string;
            const flutterwaveSignature = req.headers["verif-hash"];
            const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET || "";
            if (!webhookService.verifyFlutterwaveWebhook(flutterwaveSignature, secret)) {
                logger_1.default.warn("Flutterwave webhook invalid signature");
                throw new errorHandler_1.AppError("Invalid signature", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.UNAUTHORIZED);
            }
            res.status(200).send('OK');
            await webhookService.handleFlutterwaveWebhook(req.body);
            // return res.status(200).json({ received: true });
        }
        catch (err) {
            logger_1.default.error("Webhook error", err);
            // return res.status(err.status || 500).json({
            //     message: err.message || "Webhook error",
            // });
        }
    }
}
exports.WebhookController = WebhookController;
