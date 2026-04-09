import { Request, Response, NextFunction } from "express";
import { ClientSubscription } from "../models/clientSubcription";
import { AuthenticatedClientRequest } from "./auth";
import { Account } from "../models/Accounts";

/**
 * Middleware to ensure user has an active subscription.
 * Blocks route access if subscription is not active or expired.
 */
export const subscriptionRequired = async (req: AuthenticatedClientRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user; // Assumes auth middleware ran before
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const user = await Account.findById(userId)
        if (!user) return res.status(404).json({ message: "account not found" })

        if (user.role == "consultant") {
            return next()
        }
        // Find active subscription for this user
        const subscription = await ClientSubscription.findOne({
            clientId: userId,
            status: { $in: ["active", "non_renewing"] }
        });

        if (!subscription) {
            return res.status(403).json({ message: "You need an active subscription to access this resource." });
        }

        // Optional: check subscription expiration
        if (subscription.nextPaymentDate && subscription.nextPaymentDate < new Date()) {
            // Mark subscription as expired in DB
            subscription.status = "expired";
            await subscription.save();

            return res.status(403).json({ message: "Your subscription has expired. Please renew to access this resource." });
        }

        // Subscription is valid, continue
        next();
    } catch (err) {
        console.error("Subscription check failed:", err);
        res.status(500).json({ message: "Server error" });
    }
};
