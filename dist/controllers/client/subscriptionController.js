"use strict";
// import { PaystackService } from "../../services/paystackServices";
// //import {  ClientSubscription } from "../../models/ClientSubscription";
// import { SubscriptionService } from "../../services/client/subscriptionServices";
// import { Request, Response, NextFunction, raw } from "express";
// import { AuthenticatedRequest } from "../../middleware/verifyClients";
// import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
// import logger from "../../logger";
// import { AuthenticatedClientRequest } from "../../middleware/auth";
// import { ClientSubscription } from "../../models/clientSubcription";
// import { log } from "console";
// // import PaystackService from "../services/paystackService";
// // import Subscription from "../models/subscriptionModel";
// // import User from "../models/userModel";
// // import Plan from "../models/planModel";
// // import Transaction from "../models/transactionModel";
// const paystackServices = new PaystackService()
// const subscribtionService = new SubscriptionService()
// export class subscriptionController {
//     // async createSubscription(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
//     //     try {
//     //         const user_Id = req.user.userId
//     //         const planCode = req.body;
//     //         if (!user_Id) throw new Error("Userid not sent");
//     //         if (!planCode) throw new Error("Plancode not sent");
//     //         // const plan = await
//     //         const subscription = await subscribtionService.subscribeUser(user_Id, planCode);
//     //         sendSuccessResponse(res, subscription, "subscription created successfully", 200)
//     //     } catch (error: any) {
//     //         logger.error("subscription creation failed", error.message)
//     //         //sendErrorResponse(res, error.message, 400)
//     //         next(error)
//     //     }
//     // }
//     async startSubscription(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
//         try {
//             const userId = req.user.userId;
//             const { planId, autoRenew } = req.body;
//             const response = await subscribtionService.startSubscription(userId, planId);
//             sendSuccessResponse(res, response, "Subscription initiated", 200);
//             // return res.status(200).json({
//             //     message: "Subscription initiated",
//             //     data: response,
//             // });
//         } catch (err: any) {
//             logger.error("Error starting subscription", err);
//             next(err);
//             // return res.status(err.status || 500).json({
//             //     message: err.message || "Something went wrong",
//         }                    // });
//     }
//     async changeCard(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
//         try {
//             const clientId = req.user.userId;
//             const authUrl = await subscribtionService.changeCard(clientId)
//             logger.info("card change url sent")
//             sendSuccessResponse(res, authUrl, "authorization url sent , a small charge will be incurred", 200)
//         } catch (err: any) {
//             logger.error("Error sending url", err);
//             next(err)
//         }
//     }
//     async cancelSubscription(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
//         try {
//             const userId = req.user.userId;
//             const sub = await ClientSubscription.findOne({ clientId: userId, status: "active" })
//             if (!sub) throw new Error("you have no active subscriptions, plss subscribe")
//             const token = sub?.paystackAuthorizationToken as string
//             console.log(sub.paystackSubscriptionCode)
//             const subscription = await subscribtionService.cancelSubscriptionLocal(sub.paystackSubscriptionCode as string, token);
//             sendSuccessResponse(res, subscription, "subscription cancelled successfully", 200)
//         } catch (error: any) {
//             logger.error("subscription cancellation failed", error.message)
//             //sendErrorResponse(res, error.message, 400)
//             next(error)
//         }
//     }
//     async getUserSubscription(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
//         try {
//             const userId = req.user.userId;
//             const sub = await ClientSubscription.findOne({ user: userId })
//             //const token = sub?.paystackAuthorizationToken as string
//             if (!userId) throw new Error("User not found");
//             const subscription = await subscribtionService.getSubscriptionsLocal(userId);
//             if (!subscription) throw new Error("Subscription not found");
//             sendSuccessResponse(res, subscription, "subscription retrieved successfully", 200)
//         } catch (error: any) {
//             logger.error("subscription retrieval failed", error.message)
//             //sendErrorResponse(res, error.message, 400)
//             next(error)
//         }
//     }
//     async updateSubscription(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
//         try {
//             const userId = req.user.userId;
//             const planId = req.body.planId
//             const sub = await ClientSubscription.findOne({ clientId: userId, status: { $in: ["active", "non_renewing"] } })
//             if (!sub) throw new Error("you have no active subscriptions, plss subscribe")
//             const token = sub?.paystackAuthorizationToken as string
//             const subscription = await subscribtionService.upgradeSubscription(userId, planId);
//             sendSuccessResponse(res, subscription, "subscription updated successfully", 200)
//         } catch (error: any) {
//             logger.error("subscription update failed", error.message)
//             //sendErrorResponse(res, error.message, 400)
//             next(error)
//         }
//     }
//     // async webhookHandler(req: Request, res: Response, next: NextFunction) {
//     //     try {
//     //         const payload = req.body;
//     //         const signature = req.headers["x-paystack-signature"] as string;
//     //         const isValid = paystackServices.verifyWebhookSignature(payload, signature);
//     //         if (!isValid) throw new Error("Invalid signature");
//     //         const subscription = await subscribtionService.handleWebhookEvent(payload);
//     //         sendSuccessResponse(res, subscription, "subscription updated successfully", 200)
//     //     } catch (error: any) {
//     //         logger.error("subscription update failed", error.message)
//     //         //sendErrorResponse(res, error.message, 400)
//     //         next(error)
//     //     }
//     // }
//     async handle(req: Request, res: Response, next: NextFunction) {
//         try {
//             const signature = req.headers["x-paystack-signature"] as any;
//             const rawBody = req.body
//             res.status(200).send('OK');
//             await subscribtionService.handle(rawBody, signature);
//             //sendSuccessResponse(res, null, "Subscription updated successfully", 200)
//             //return res.sendStatus(200);
//         } catch (err: any) {
//             logger.error("Webhook error", err);
//             // return res.status(err.status || 500).json({
//             //     message: err.message || "Webhook error",
//             // });
//         }
//     }
// }
