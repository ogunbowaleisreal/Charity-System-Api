"use strict";
// import { PaystackService } from "../paystackServices";
// import { Account } from "../../models/Accounts";
// import { ClientSubscription } from "../../models/clientSubcription";
// import Plan from "../../models/Plan";
// //import { Account } from "../../models/Accounts";
// //import { ClientSubscription } from "../../models/clientSubcription";
// import transaction from "../../models/transaction";
// import EmailService from "../Email.services";
// import logger from "../../logger";
// const paystack = new PaystackService();
// const emailService = new EmailService();
// export class SubscriptionService {
//     async ensureCustomer(userId: string) {
//         const user = await Account.findById(userId);
//         if (!user) throw new Error("User not found");
//         if (user.paystackCustomerCode) return user.paystackCustomerCode;
//         const customer = await paystack.createCustomer({ email: user.email, first_name: user.firstName, last_name: user.lastName, phone: user.phone });
//         user.paystackCustomerCode = customer.customer_code;
//         await user.save();
//         return customer.customer_code;
//     }
//     async startSubscription(userId: string, planId: string) {
//         // 1️⃣ Validate user and plan
//         const user = await Account.findById(userId);
//         if (!user) throw { status: 404, message: "User not found" };
//         if (user.role == "consultant") throw { status: 403, message: "must be signed in as a client to subscribe" }
//         const plan = await Plan.findById(planId);
//         if (!plan) throw { status: 404, message: "Plan not found" };
//         //const customer = await this.ensureCustomer(user._id.toString());
//         // 2️⃣ Check if the user already has a subscription for this plan
//         let subscription = await ClientSubscription.findOne({
//             clientId: user._id,
//             planId: plan._id,
//             status: { $in: ["active", "non_renewing"] }
//         });
//         if (subscription) throw { status: 403, message: "you already have a plan running , please upgrade/downgrade to get a new one" }
//         const amountInKobo = paystack.toKobo(plan.amount);
//         // 3️⃣ If no subscription exists → create a local one
//         const intentId = crypto.randomUUID();
//         // 4️⃣ Initialize a new Paystack payment for THIS month
//         const trx = await paystack.initializeTransaction({
//             email: user.email,
//             amount: amountInKobo,
//             currency: plan.currency || "NGN",
//             callback_url: process.env.CLIENT_CALLBACK_URL,
//             metadata: {
//                 userId: user._id,
//                 planId: plan._id,
//                 intentId: intentId,
//                 //subscriptionId: subscription._id,
//                 type: "MANUAL_SUBSCRIPTION_PAYMENT",
//             },
//         });
//         // 5️⃣ Save transaction in DB
//         await transaction.create({
//             user: user._id,
//             plan: plan._id,
//             reference: trx.data.reference,
//             amount: plan.amount,
//             currency: plan.currency || "NGN",
//             status: "Pending",
//             intentId: intentId,
//             channel: "Paystack",
//             metadata: {
//                 userId: user._id,
//                 planId: plan._id,
//                 intentId: intentId,
//                 intent: "MANUAL_SUBSCRIPTION_PAYMENT",
//             },
//             type: "MANUAL_SUBSCRIPTION_PAYMENT"
//         });
//         // 6️⃣ Return authorization URL for user to pay
//         return {
//             //subscriptionId: subscription._id,
//             authorizationUrl: trx.data.authorization_url,
//             reference: trx.data.reference
//         };
//     }
//     async createLocalPlanIfNeeded(paystackPlanData: { name: string; amount: number; interval: string; currency?: string; plan_code: string; description?: string }) {
//         const existing = await Plan.findOne({ paystackPlanCode: paystackPlanData.plan_code });
//         if (existing) return existing;
//         const plan = await Plan.create({
//             name: paystackPlanData.name,
//             amount: paystackPlanData.amount,
//             interval: paystackPlanData.interval === "annually" ? "annually" : "monthly",
//             currency: paystackPlanData.currency || "NGN",
//             paystackPlanCode: paystackPlanData.plan_code,
//             description: paystackPlanData.description,
//         });
//         return plan;
//     }
//     async getSubscriptionsLocal(userId: string) {
//         const subs = await ClientSubscription.find({ clientId: userId }).populate("planId").populate({ path: "clientId", select: "firstName lastName email phone role " }).lean();
//         return subs;
//     }
//     async cancelSubscriptionLocal(subscriptionCode: string, token: string) {
//         const local = await ClientSubscription.findOne({ paystackSubscriptionCode: subscriptionCode });
//         if (!local) throw new Error("subscription not found")
//         const paystackSubscribtion = await paystack.getSubscription(subscriptionCode)
//         if (!paystackSubscribtion) throw new Error("subscription not found on paystack")
//         console.log(paystackSubscribtion)
//         //const auth = await paystack.getLatestReusableAuthorization(local.paystackCustomerCode as string)
//         // console.log(auth)
//         // console.log(local.paystackCustomerCode)
//         const res = await paystack.cancelSubscription(subscriptionCode, paystackSubscribtion.data.email_token);
//         // update local record
//         // if (local) {
//         //     local.status = "cancelled";
//         //     await local.save();
//         // }
//         return res;
//     }
//     async changeCard(clientId: string) {
//         // Find active subscription
//         const sub = await ClientSubscription.findOne({
//             clientId,
//             status: "active",
//         });
//         if (!sub) {
//             throw new Error("You don’t have an active subscription to update.");
//         }
//         if (!sub.paystackSubscriptionCode) {
//             throw new Error("No Paystack subscription code found for this subscription.");
//         }
//         // Generate manage link via Paystack API
//         const manageLink = await paystack.generateSubscriptionUpdateLink(
//             sub.paystackSubscriptionCode
//         );
//         // Return link to frontend to redirect the user
//         return { manageLink };
//     }
//     //      * IMPORTANT:
//     //  * - We do NOT cancel anything here.
//     //  * - We only collect payment for the new plan.
//     //  * - Replacement happens AFTER subscription.create webhook.
//     //  */
//     async upgradeSubscription(userId: string, newPlanId: string) {
//         // 1️⃣ Validate user
//         const user = await Account.findById(userId);
//         if (!user) throw new Error("User not found");
//         // 2️⃣ Get current active subscription
//         const currentSub = await ClientSubscription.findOne({
//             clientId: userId,
//             status: { $in: ["active", "non_renewing"] }
//         });
//         if (!currentSub) {
//             throw new Error("No active subscription to upgrade");
//         }
//         // 3️⃣ Validate new plan
//         const newPlan = await Plan.findById(newPlanId);
//         if (!newPlan) throw new Error("Target plan not found");
//         // (Optional) enforce upgrade-only rule
//         if (String(newPlan._id) === String(currentSub.planId)) {
//             throw new Error("Already on this plan");
//         }
//         const intentId = crypto.randomUUID();
//         const amountInKobo = paystack.toKobo(newPlan.amount);
//         // 4️⃣ Initialize payment for the NEW plan
//         // This creates the first charge required by Paystack
//         const trx = await paystack.initializeTransaction({
//             email: user.email,
//             amount: amountInKobo,
//             currency: newPlan.currency,
//             callback_url: process.env.CLIENT_CALLBACK_URL,
//             metadata: {
//                 userId,
//                 newPlanId,
//                 oldSubscriptionId: currentSub._id,
//                 intent: "UPGRADE_SUBSCRIPTION",
//                 intentId: intentId
//             }
//         });
//         // 5️⃣ Persist transaction
//         await transaction.create({
//             user: userId,
//             plan: newPlan._id,
//             reference: trx.data.reference,
//             amount: newPlan.amount,
//             currency: newPlan.currency,
//             status: "Pending",
//             channel: "Paystack",
//             type: "UPGRADE_SUBSCRIPTION",
//             metadata: {
//                 oldSubscriptionId: currentSub._id,
//                 newPlanId,
//                 intent: "UPGRADE_SUBSCRIPTION",
//                 intentId: intentId
//             }
//         });
//         // 6️⃣ Return Paystack payment URL
//         return {
//             authorizationUrl: trx.data.authorization_url,
//             reference: trx.data.reference
//         };
//     }
//     // async changeCard(clientId: string) {
//     //     const sub = await ClientSubscription.findOne({
//     //         clientId: clientId,
//     //         status: "active"
//     //     }).lean();
//     //     if (!sub) {
//     //         throw new Error("you dont have a renewing subscription")
//     //     }
//     //     const user = await Account.findById(clientId)
//     //     if (!user) throw new Error("Account not found ")
//     //     const init = await paystack.initializeTransaction({
//     //         email: user.email,
//     //         amount: 100, // Paystack requires small amount (₦1 or ₦50)
//     //         metadata: {
//     //             updateCardForSubscription: true,
//     //             clientId,
//     //             subscriptionCode: sub.paystackSubscriptionCode,
//     //             planId: sub.planId
//     //         }
//     //     });
//     //     return { authorizationUrl: init.authorization_url }
//     // }
//     async handle(payload: any, signature: string) {
//         const paystack = new PaystackService();
//         try {
//             // Verify webhook
//             const isValid = paystack.verifyWebhookSignature(payload, signature);
//             if (!isValid) throw { status: 400, message: "Invalid signature" };
//             const parsedPayload = JSON.parse(payload.toString());
//             const event = parsedPayload.event;
//             const data = parsedPayload.data;
//             // Start a MongoDB session
//             const session = await transaction.startSession(); // start session on any collection
//             session.startTransaction();
//             try {
//                 // ------------------------
//                 // 1️⃣ Initial Payment (charge.success)
//                 // ------------------------
//                 if (event === "charge.success") {
//                     const { reference, amount, customer, authorization, metadata } = data;
//                     const intent = metadata?.intent;
//                     console.log(event)
//                     console.log(metadata)
//                     let planIdToUse = metadata.planId;
//                     if (metadata.type == "MANUAL_SUBSCRIPTION_PAYMENT") {
//                         const plan = await Plan.findById(planIdToUse);
//                         if (!plan) throw new Error("Plan not found");
//                         const existingTx = await transaction.findOne({ reference }).session(session);
//                         console.log(existingTx)
//                         if (!existingTx) {
//                             await transaction.create([{
//                                 user: metadata?.userId || undefined,
//                                 plan: metadata?.planId || undefined,
//                                 amount,
//                                 reference,
//                                 intentId: metadata?.intentId,
//                                 subscriptionTempId: data.customer?.customer_code,
//                                 status: "Completed",
//                                 channel: authorization?.channel || "paystack",
//                                 metadata: metadata || {},
//                                 paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
//                             }], { session });
//                         } else if (existingTx.status === "Pending") {
//                             existingTx.status = "Completed";
//                             existingTx.amount = amount;
//                             existingTx.channel = authorization?.channel || "paystack";
//                             existingTx.subscriptionTempId = data.customer?.customer_code;
//                             existingTx.metadata = metadata || existingTx.metadata;
//                             existingTx.paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
//                             await existingTx.save({ session });
//                         }
//                         const subscription = await paystack.createSubscription({
//                             customer: customer.customer_code,
//                             plan: plan?.paystackPlanCode,
//                             authorization: authorization.authorization_code
//                         });
//                         logger.info("MANUAL_SUBSCRIPTION: paystack response", {
//                             subscription_code: subscription?.data?.subscription_code
//                         });
//                         console.log({ subscription_code: subscription?.data?.subscription_code })
//                         //   console.log(metadata.userId, metadata.planId)
//                         console.log("creating pending subscription")
//                         const clientSub = await ClientSubscription.create([{
//                             clientId: metadata.userId,
//                             planId: metadata.planId,
//                             paystackSubscriptionCode: subscription.data.subscription_code,
//                             paystackCustomerCode: customer.customer_code,
//                             paystackAuthorizationToken: authorization.authorization_code,
//                             transactionReference: reference,
//                             status: "pending",
//                             intentId: metadata.intentId
//                         }], { session });
//                         const existingSubscription = await ClientSubscription.findOne({
//                             intentId: metadata?.intentId,
//                             // clientId: metadata?.userId,
//                             // planId: metadata?.planId,
//                             // status: "active"
//                         }).session(session);
//                         if (!existingSubscription) {
//                             await Account.findOneAndUpdate({ _id: metadata.userId }, {
//                                 $set: {
//                                     paystackCustomerCode: data.customer.customer_code,
//                                     paystackAuthorizationToken: authorization.authorization_code
//                                 }
//                             }, { session });
//                             console.log("manual subscription")
//                             console.log(data)
//                             console.log("hitting paystack api")
//                         }
//                         // if needed
//                         logger.info("MANUAL_SUBSCRIPTION: saved", {
//                             sub: clientSub
//                         });
//                         console.log(clientSub)
//                         await session.commitTransaction()
//                         return
//                     }
//                     if (intent === "UPGRADE_SUBSCRIPTION") {
//                         planIdToUse = metadata.newPlanId;
//                     }
//                     console.log(event)
//                     if (intent === "UPGRADE_SUBSCRIPTION") {
//                         console.log("in update")
//                         // 🔐 CLAIM the upgrade (idempotency guard)
//                         const oldSub = await ClientSubscription.findOneAndUpdate(
//                             {
//                                 _id: metadata.oldSubscriptionId,
//                                 status: { $in: ["active", "non_renewing"] }
//                             },
//                             {
//                                 $set: {
//                                     status: "cancelled",
//                                     cancelledAt: new Date(),
//                                     // transactionReference:reference
//                                 }
//                             },
//                             { new: true, session }
//                         );
//                         // If null → another webhook already handled this upgrade
//                         if (!oldSub) {
//                             console.log("Upgrade already processed, skipping");
//                             throw new Error("Upgrade already processed")
//                         }
//                         // 1️⃣ Complete the upgrade transaction as usual
//                         const existingTx = await transaction.findOne({ reference }).session(session);
//                         if (!existingTx) {
//                             await transaction.create([{
//                                 user: metadata.userId,
//                                 plan: metadata.newPlanId,
//                                 reference,
//                                 amount,
//                                 status: "Completed",
//                                 channel: authorization?.channel || "paystack",
//                                 metadata,
//                                 paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
//                             }], { session });
//                         } else if (existingTx.status === "Pending") {
//                             existingTx.status = "Completed";
//                             existingTx.amount = amount;
//                             existingTx.channel = authorization?.channel || "paystack";
//                             await existingTx.save({ session });
//                         }
//                         // 2️⃣ Expire old subscription
//                         // const oldSub = await ClientSubscription.findById(metadata.oldSubscriptionId).session(session);
//                         // if (oldSub) {
//                         //     oldSub.status = "expired";
//                         //     oldSub.autoRenew = false;
//                         //     oldSub.cancelledAt = new Date();
//                         //     await oldSub.save({ session });
//                         // }
//                         const sub = await paystack.getSubscription(oldSub?.paystackSubscriptionCode as string);
//                         if (!sub) throw new Error("Subscription not found");
//                         console.log(sub)
//                         console.log(event)
//                         if (oldSub.status == "active") {
//                             const cancelled = await paystack.cancelSubscription(oldSub?.paystackSubscriptionCode as string, sub.data.email_token as string);
//                             if (!cancelled) throw new Error("Subscription not cancelled");
//                             console.log("upgrade subscription, cancelling old one")
//                         }
//                         const plan = await Plan.findById(metadata.newPlanId);
//                         if (!plan) throw new Error("Plan not found");
//                         const newSub = await paystack.createSubscription({
//                             customer: oldSub?.paystackCustomerCode,
//                             plan: plan?.paystackPlanCode,
//                             authorization: oldSub?.paystackAuthorizationToken
//                         });
//                         if (!newSub) throw new Error("Subscription not created");
//                         // 3️⃣ Create new subscription in pending state (optional)
//                         await ClientSubscription.create([{
//                             clientId: metadata.userId,
//                             planId: metadata.newPlanId,
//                             status: "pending",
//                             paystackSubscriptionCode: newSub.data.subscription_code,
//                             intentId: metadata.intentId || reference, // or generate a new intentId
//                             paystackCustomerCode: oldSub?.paystackCustomerCode,
//                             transactionReference: reference, // reuse customer code
//                             paystackAuthorizationToken: oldSub?.paystackAuthorizationToken
//                         }], { session });
//                         await session.commitTransaction();
//                         return; // skip the rest of normal new subscription logic
//                     }
//                     if (data.subscription) {
//                         console.log("in recurring")
//                         console.log(data)
//                         const existingSub = await ClientSubscription.findOne({ paystackSubscriptionCode: data.subscription.subscription_code }).session(session);
//                         const subDetails = await paystack.getSubscription(data.subscription.subscription_code);
//                         if (existingSub) {
//                             existingSub.status = "active";
//                             existingSub.autoRenew = true;
//                             existingSub.nextPaymentDate = new Date(subDetails.data.next_payment_date);
//                             // existingSub.cancelledAt = null;
//                             await existingSub.save({ session });
//                         }
//                         const transactionExists = await transaction.findOne({ reference }).session(session);
//                         if (!transactionExists) {
//                             await transaction.create([{
//                                 user: existingSub?.clientId || undefined,
//                                 plan: existingSub?.planId || undefined,
//                                 amount,
//                                 reference,
//                                 intentId: metadata?.intentId,
//                                 type: "recurring",
//                                 subscriptionTempId: data.customer?.customer_code,
//                                 status: "Completed",
//                                 channel: authorization?.channel || "paystack",
//                                 metadata: metadata || {},
//                                 paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
//                             }], { session });
//                         }
//                         const account = await Account.findById(existingSub?.clientId).session(session);
//                         if (account) {
//                             account.subscriptionStatus = "active";
//                             account.subscriptionEndDate = new Date(subDetails.data.next_payment_date);
//                             await account.save({ session });
//                         }
//                         await session.commitTransaction();
//                         return;
//                     }
//                     console.log(reference)
//                     console.log(metadata)
//                     // const plan = await Plan.findById(metadata.planId).session(session);
//                     // if (!plan) throw new Error("Plan not found");
//                 }
//                 // ------------------------
//                 // 2️⃣ Subscription Created
//                 // ------------------------
//                 if (event === "subscription.create") {
//                     const { subscription_code, customer, createdAt, next_payment_date } = data;
//                     console.log(event)
//                     console.log(data)
//                     // const existingSub = await ClientSubscription.findOne({ paystackSubscriptionCode: subscription_code }).session(session);
//                     // if (!existingSub) {
//                     //     const lastTx = await transaction.findOne({
//                     //         subscriptionTempId: customer.customer_code,
//                     //         type: "NEW MANUAL PAYMENT",
//                     //         status: "Completed"
//                     //     }).sort({ createdAt: -1 }).lean().session(session);
//                     //     if (!lastTx?.metadata?.userId || !lastTx?.metadata?.planId) throw new Error("Cannot find userId or planId");
//                     console.log(next_payment_date)
//                     const sub = await ClientSubscription.findOne({
//                         paystackSubscriptionCode: subscription_code
//                     });
//                     if (!sub || sub.status === "active") {
//                         console.log("Subscription already active or not found")
//                         return;
//                     }
//                     if (sub?.type == "migration") {
//                         //const sub = await paystack.getSubscription(subscription_code);
//                         console.log(sub)
//                         console.log("migrating... ")
//                         sub.status = "active";
//                         sub.currentPeriod.end = data.next_payment_date
//                         await sub.save();
//                         console.log(event)
//                         await Account.updateOne({ _id: sub.clientId }, {
//                             $set: {
//                                 paystackCustomerCode: customer.customer_code,
//                                 subscriptionPlan: sub.planId,
//                                 subscriptionStatus: "active",
//                                 subscriptionEndDate: new Date(next_payment_date),
//                                 subscriptionTransactionReference: sub.transactionReference
//                                 // subscriptionStartDate: new Date(sub.start_date),
//                             }
//                         }, { session });
//                         return
//                     }
//                     console.log(sub)
//                     sub.status = "active";
//                     sub.currentPeriod = {
//                         start: new Date(data.createdAt),
//                         end: data.next_payment_date
//                             ? new Date(data.next_payment_date)
//                             : null
//                     };
//                     await sub.save();
//                     console.group(event)
//                     const user = await Account.findById(sub?.clientId).session(session);
//                     // await ClientSubscription.create([{
//                     //     clientId: existingSub?.clientId,
//                     //     planId: existingSub?.planId,
//                     //     paystackSubscriptionCode: subscription_code,
//                     //     paystackCustomerCode: customer.customer_code,
//                     //     paystackAuthorizationToken: user?.paystackAuthorizationToken,
//                     //     status: "active",
//                     //     autoRenew: true,
//                     //     currentPeriod: {
//                     //         start: new Date(createdAt),
//                     //         end: next_payment_date ? new Date(next_payment_date) : null,
//                     //     },
//                     //     nextPaymentDate: next_payment_date ? new Date(next_payment_date) : null,
//                     // }], { session });
//                     console.log("updating accounts now ....")
//                     await Account.updateOne({ _id: sub.clientId }, {
//                         $set: {
//                             paystackCustomerCode: customer.customer_code,
//                             subscriptionPlan: sub.planId,
//                             subscriptionStatus: "active",
//                             subscriptionEndDate: new Date(next_payment_date),
//                             subscriptionStartDate: new Date(createdAt),
//                             subscriptionTransactionReference: sub.transactionReference
//                         }
//                     }, { session });
//                 }
//                 // ------------------------
//                 // 3️⃣ Update Authorization
//                 // ------------------------
//                 if (event === "subscription.update_authorization") {
//                     const { subscription_code, authorization } = data;
//                     const sub = await ClientSubscription.findOne({ paystackSubscriptionCode: subscription_code }).session(session);
//                     console.log(data)
//                     if (sub) {
//                         sub.paystackAuthorizationToken = authorization.authorization_code;
//                         await sub.save({ session });
//                         await Account.updateOne({ _id: sub.clientId }, {
//                             $set: { paystackAuthorizationToken: authorization.authorization_code }
//                         }, { session });
//                     }
//                 }
//                 // ------------------------
//                 // 4️⃣ Subscription Renewal (invoice.success)
//                 // ------------------------
//                 if (event === "invoice.create") {
//                     const { subscription, amount, customer, paid_at, next_payment_date, authorization, invoice_code } = data;
//                     console.log(event)
//                     console.log(data)
//                     if (!subscription?.subscription_code) throw new Error("No subscription code");
//                     const sub = await ClientSubscription.findOne({ paystackSubscriptionCode: subscription.subscription_code }).session(session);
//                     if (!sub) throw new Error("Subscription not found");
//                     console.log(sub)
//                     sub.status = "active";
//                     sub.currentPeriod = {
//                         start: paid_at ? new Date(paid_at) : new Date(),
//                         end: subscription.next_payment_date ? new Date(subscription.next_payment_date) : null,
//                     };
//                     sub.transactionReference = data.transaction.reference
//                     sub.nextPaymentDate = new Date(subscription.next_payment_date);
//                     await sub.save({ session });
//                     console.log("sub after updaing", sub)
//                     const existingTx = await transaction.findOne({ reference: invoice_code }).session(session);
//                     if (!existingTx) {
//                         await transaction.create([{
//                             user: sub.clientId,
//                             plan: sub.planId,
//                             subscription: sub._id,
//                             amount,
//                             reference: data.transaction.reference,
//                             status: "Completed",
//                             type: "RENEWAL",
//                             channel: authorization?.channel || "paystack",
//                             metadata: data,
//                             paidAt: paid_at ? new Date(paid_at) : new Date(),
//                         }], { session });
//                     }
//                     const account = await Account.updateOne({ _id: sub.clientId }, {
//                         $set: {
//                             paystackCustomerCode: customer.customer_code,
//                             subscriptionPlan: sub.planId,
//                             subscriptionStatus: "active",
//                             subscriptionEndDate: new Date(subscription.next_payment_date),
//                             subscriptionStartDate: new Date(paid_at),
//                             subscriptionTransactionReference: data.transaction.reference
//                         }
//                     }, { session });
//                     console.log(account)
//                     await session.commitTransaction()
//                     return
//                 }
//                 // if (event === "invoice.failed") {
//                 //     const { subscription, amount, customer, invoice_code } = data;
//                 //     const sub = await ClientSubscription.findOne({ paystackSubscriptionCode: subscription.subscription_code });
//                 //     if (!sub) return;
//                 //     sub.status = "expired";
//                 //     sub.autoRenew = false;
//                 //     sub.cancelledAt = new Date();
//                 //     await sub.save();
//                 //     await Account.updateOne({ _id: sub.clientId }, {
//                 //         $set: {
//                 //             subscriptionStatus: "expired",
//                 //             paystackAuthorizationToken: null,
//                 //             subscriptionPlan: null,
//                 //             subscriptionEndDate: null,
//                 //             subscriptionStartDate: null,
//                 //         }
//                 //     });
//                 //     // Optionally, notify the user via email/SMS
//                 // }
//                 if (event === "invoice.payment_failed") {
//                     const { subscription, amount, customer, invoice_code } = data;
//                     console.log(event)
//                     const sub = await ClientSubscription.findOne({ paystackSubscriptionCode: subscription.subscription_code }).session(session);
//                     if (!sub) throw new Error("Subscription not found");
//                     sub.status = "expired";
//                     sub.autoRenew = false;
//                     sub.cancelledAt = new Date();
//                     await sub.save({ session });
//                     await Account.updateOne({ _id: sub.clientId }, {
//                         $set: {
//                             subscriptionStatus: "expired",
//                             paystackAuthorizationToken: null,
//                             subscriptionPlan: null,
//                             subscriptionEndDate: null,
//                             subscriptionStartDate: null,
//                         }
//                     }, { session });
//                     // Optional: send email notification
//                 }
//                 // ------------------------
//                 // 5️⃣ Subscription Cancelled / Disabled
//                 // ------------------------
//                 if (event === "subscription.disable" || event === "subscription.not_renew") {
//                     const { subscription_code } = data;
//                     if (!subscription_code) throw new Error("No subscription code");
//                     const sub = await ClientSubscription.findOne({ paystackSubscriptionCode: subscription_code }).session(session);
//                     if (!sub) throw new Error("Subscription not found");
//                     sub.status = event === "subscription.disable" ? "expired" : "non_renewing";
//                     sub.autoRenew = false;
//                     sub.cancelledAt = new Date();
//                     await sub.save({ session });
//                     await Account.updateOne({ _id: sub.clientId }, {
//                         $set: {
//                             subscriptionStatus: event === "subscription.disable" ? "expired" : "non_renewing",
//                         }
//                     }, { session });
//                 }
//                 console.log(event)
//                 // Commit transaction
//                 await session.commitTransaction();
//             } catch (err: any) {
//                 // Rollback everything if any operation fails
//                 await session.abortTransaction();
//                 console.error("Webhook transaction failed:", err.message);
//                 logger.error("Webhook transaction failed:", err.message);
//             } finally {
//                 session.endSession();
//             }
//         } catch (err: any) {
//             logger.error(err.message);
//         }
//     }
//     //     async handle(payload: any, signature: string) {
//     //         const paystack = new PaystackService();
//     //         try {
//     //             // Verify webhook
//     //             const isValid = paystack.verifyWebhookSignature(payload, signature);
//     //             if (!isValid) throw { status: 400, message: "Invalid signature" };
//     //             const parsedPayload = JSON.parse(payload.toString())
//     //             const event = parsedPayload.event;
//     //             const data = parsedPayload.data;
//     //             // ------------------------
//     //             // 1️⃣ Initial Payment (charge.success)
//     //             // ------------------------
//     //             if (event === "charge.success") {
//     //                 const { reference, amount, customer, authorization, metadata } = data;
//     //                 try {
//     //                     // Find existing transaction by reference to avoid duplicates
//     //                     const existingTx = await transaction.findOne({ reference });
//     //                     if (!existingTx) {
//     //                         await transaction.create({
//     //                             user: metadata?.userId || undefined,
//     //                             plan: metadata?.planId || undefined,
//     //                             amount,
//     //                             reference,
//     //                             subscriptionTempId: data.customer?.customer_code,
//     //                             status: "Completed",
//     //                             channel: authorization?.channel || "paystack",
//     //                             metadata: metadata || {},
//     //                             paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
//     //                         });
//     //                     } else {
//     //                         // Update pending transaction
//     //                         if (existingTx.status === "Pending") {
//     //                             existingTx.status = "Completed";
//     //                             existingTx.amount = amount;
//     //                             existingTx.channel = authorization?.channel || "paystack";
//     //                             existingTx.subscriptionTempId = data.customer?.customer_code;
//     //                             existingTx.metadata = metadata || existingTx.metadata;
//     //                             existingTx.paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
//     //                             await existingTx.save();
//     //                         }
//     //                     }
//     //                     const plan = await Plan.findById(metadata.planId)
//     //                     if (!plan) return
//     //                     const existingSubscription = await ClientSubscription.findOne({
//     //                         clientId: metadata?.userId,
//     //                         planId: metadata?.planId,
//     //                         status: "active"
//     //                     });
//     //                     if (existingSubscription) return;
//     //                     await Account.findOneAndUpdate({ _id: metadata.userId }, {
//     //                         $set: {
//     //                             paystackCustomerCode: data.customer.customer_code,
//     //                             paystackAuthorizationToken: authorization.authorization_code
//     //                         }
//     //                     })
//     //                     const subscription = await paystack.createSubscription({ customer: customer.customer_code, plan: plan?.paystackPlanCode, authorization: authorization.authorization_code });
//     //                     // await ClientSubscription.create({ paystackSubscriptionCode: subscription.subscription_code ,clientId: metadata?.userId,planId: metadata?.planId, });
//     //                 } catch (err: any) {
//     //                     console.error("transaction webhook failed", err.message)
//     //                     logger.error("transaction webhook failed", err.message)
//     //                 }
//     //             }
//     //             // ------------------------
//     //             // 2️⃣ Subscription Created
//     //             // ------------------------
//     //             if (event === "subscription.create") {
//     //                 const { subscription_code, customer, plan, createdAt, next_payment_date } = data;
//     //                 try {
//     //                     console.log("subscription.create webhook triggered....");
//     //                     // Check if subscription already exists
//     //                     const existingSub = await ClientSubscription.findOne({ paystackSubscriptionCode: subscription_code });
//     //                     if (existingSub) return;
//     //                     //Attempt to find last transaction for this customer to get userId & planId
//     //                     const lastTx = await transaction.findOne({
//     //                         "subscriptionTempId": customer.customer_code,
//     //                         type: "NEW MANUAL PAYMENT", // match the temp field,
//     //                         status: "Completed"
//     //                     }).sort({ createdAt: -1 }).lean();
//     //                     if (!lastTx?.metadata?.userId || !lastTx?.metadata?.planId) {
//     //                         console.log("subscription.create: Could not find userId/planId");
//     //                         return;
//     //                     }
//     //                     const user = await Account.findById(lastTx.metadata.userId)
//     //                     await ClientSubscription.create({
//     //                         clientId: lastTx.metadata.userId,
//     //                         planId: lastTx.metadata.planId,
//     //                         paystackSubscriptionCode: subscription_code,
//     //                         paystackCustomerCode: customer.customer_code,
//     //                         paystackAuthorizationToken: user?.paystackAuthorizationToken,
//     //                         status: "active",
//     //                         autoRenew: true,
//     //                         currentPeriod: {
//     //                             start: new Date(createdAt),
//     //                             end: next_payment_date ? new Date(next_payment_date) : null,
//     //                         },
//     //                         nextPaymentDate: next_payment_date ? new Date(next_payment_date) : null,
//     //                     });
//     //                     await Account.updateOne({ _id: lastTx.metadata.userId }, {
//     //                         $set: {
//     //                             paystackCustomerCode: customer.customer_code,
//     //                             subscriptionPlan: lastTx.metadata.planId,
//     //                             subscriptionStatus: "active",
//     //                             subscriptionEndDate: new Date(next_payment_date),
//     //                             subscriptionStartDate: new Date(createdAt),
//     //                         }
//     //                     })
//     //                     console.log("Subscription created successfully for user:", lastTx.metadata.userId);
//     //                     logger.info("Subscription created successfully for user:", lastTx.metadata.userId);
//     //                 } catch (err: any) {
//     //                     console.error("failed to create subscription", err.message)
//     //                     logger.error("failed to create subscription", err.message)
//     //                 }
//     //                 //          await emailService.sendSubscriptionCreatedEmail(user?.email, plan.name, next_payment_date);
//     //             }
//     //             if (event === "subscription.update_authorization") {
//     //                 try {
//     //                     const { subscription_code, authorization } = data;
//     //                     const sub = await ClientSubscription.findOne({
//     //                         paystackSubscriptionCode: subscription_code
//     //                     });
//     //                     if (!sub) return;
//     //                     sub.paystackAuthorizationToken = authorization.authorization_code;
//     //                     await sub.save();
//     //                     const account = await Account.updateOne({ _id: sub.clientId }, {
//     //                         $set: {
//     //                             paystackAuthorizationToken: authorization.authorization_code
//     //                         }
//     //                     })
//     //                     console.log(account)
//     //                     console.log("Card updated successfully for subscription:", subscription_code);
//     //                 } catch (err: any) {
//     //                     console.error("failed to update card", err.message)
//     //                     logger.error("failed to update card", err.message)
//     //                 }
//     //             }
//     //             // ------------------------
//     //             // 3️⃣ Subscription Renewals (invoice.success)
//     //             // ------------------------
//     //             if (event === "invoice.success") {
//     //                 const { subscription, amount, customer, paid_at, next_payment_date, authorization, invoice_code } = data;
//     //                 if (!subscription?.subscription_code) return;
//     //                 const sub = await ClientSubscription.findOne({ paystackSubscriptionCode: subscription.subscription_code });
//     //                 if (!sub) return;
//     //                 // Update subscription period
//     //                 sub.status = "active";
//     //                 sub.currentPeriod = {
//     //                     start: paid_at ? new Date(paid_at) : new Date(),
//     //                     end: next_payment_date ? new Date(next_payment_date) : null,
//     //                 };
//     //                 if (!sub.nextPaymentDate) return
//     //                 sub.nextPaymentDate = new Date(next_payment_date);
//     //                 await sub.save();
//     //                 // Avoid duplicate transactions
//     //                 const existingTx = await transaction.findOne({ reference: invoice_code });
//     //                 if (!existingTx) {
//     //                     await transaction.create({
//     //                         user: sub.clientId,
//     //                         plan: sub.planId,
//     //                         subscription: sub._id,
//     //                         amount,
//     //                         reference: invoice_code,
//     //                         status: "success",
//     //                         type: "RENEWAL",
//     //                         channel: authorization?.channel || "paystack",
//     //                         metadata: data,
//     //                         paidAt: paid_at ? new Date(paid_at) : new Date(),
//     //                     });
//     //                 }
//     //                 await Account.updateOne({ _id: sub.clientId }, {
//     //                     $set: {
//     //                         paystackCustomerCode: customer.customer_code,
//     //                         subscriptionPlan: sub.planId,
//     //                         subscriptionStatus: "active",
//     //                         subscriptionEndDate: new Date(next_payment_date),
//     //                         subscriptionStartDate: new Date(paid_at),
//     //                     }
//     //                 })
//     //             }
//     //             // ------------------------
//     //             // 4️⃣ Subscription Cancelled / Disabled
//     //             // ------------------------
//     //             if (event === "subscription.disable" || event === "subscription.not_renew") {
//     //                 try {
//     //                     const { subscription_code } = data;
//     //                     if (!subscription_code) return;
//     //                     const sub = await ClientSubscription.findOne({ paystackSubscriptionCode: subscription_code });
//     //                     if (!sub) return;
//     //                     console.log(event)
//     //                     sub.status = event == "subscription.disable" ? "expired" : "non_renewing";
//     //                     sub.autoRenew = false;
//     //                     sub.cancelledAt = new Date();
//     //                     // sub.currentPeriod = {
//     //                     //     start: sub.currentPeriod.start,
//     //                     //     end: sub.currentPeriod.end,
//     //                     // };
//     //                     // sub.paystackSubscriptionCode =event == "subscription.disable" ? sub.paystackSubscriptionCode: null
//     //                     await sub.save();
//     //                     await Account.updateOne({ _id: sub.clientId }, {
//     //                         $set: {
//     //                             // paystackCustomerCode: sub.paystackCustomerCode,
//     //                             //subscriptionPlan: event == "subscription.disable" ? sub.planId : null,
//     //                             subscriptionStatus: event == "subscription.disable" ? "expired" : "cancelled",
//     //                             // subscriptionEndDate: event == "subscription.disable" ? sub.currentPeriod.end : null,
//     //                             // subscriptionStartDate: event == "subscription.disable" ? sub.currentPeriod.start : null,
//     //                         }
//     //                     })
//     //                 }
//     //                 catch (err: any) {
//     //                     console.error("failed to cancel subscription", err.message)
//     //                     logger.error("failed to cancel subscription", err.message)
//     //                 }
//     //             }
//     //         } catch (err: any) {
//     //             logger.error(err.message)
//     //         }
//     //     }
// }
