"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientSubscription = void 0;
const mongoose_1 = require("mongoose");
const clientSubscriptionSchema = new mongoose_1.Schema({
    clientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
        index: true,
    },
    planId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Plan",
        required: true,
    },
    paystackCustomerCode: String,
    paystackSubscriptionCode: {
        type: String,
        unique: true,
        sparse: true,
    },
    paystackAuthorizationToken: String,
    status: {
        type: String,
        enum: ["active", "non_renewing", "expired", "pending"],
        default: "pending",
        index: true,
    },
    intentId: String,
    currentPeriod: {
        start: { type: Date },
        end: { type: Date },
    },
    autoRenew: { type: Boolean, default: false },
    // Only this should be unique
    transactionReference: {
        type: String,
        unique: true,
        sparse: true,
    },
    type: {
        type: String,
        default: null,
    },
    nextPaymentDate: Date,
    lastInvoiceCode: String,
    lastInvoiceAmount: Number,
    lastPaidAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    trialStart: Date,
    trialEnd: Date,
    emailToken: String,
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
    collection: "client_subscriptions",
});
// Correct index
clientSubscriptionSchema.index({ clientId: 1, status: 1 });
clientSubscriptionSchema.index({ status: 1, nextPaymentDate: 1 });
exports.ClientSubscription = (0, mongoose_1.model)("ClientSubscription", clientSubscriptionSchema);
