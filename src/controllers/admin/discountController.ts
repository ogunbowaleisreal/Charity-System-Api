import { Request, Response } from "express";
import Plan from "../../models/Plan";
import PlanDiscount, { IPlanDiscount } from "../../models/discount";
import { AdminAuthenticatedRequest } from "../../types/admin.management";

// POST /admin/plans/:planId/discount
export class AdminDiscountController {
    createPlanDiscount = async (req: AdminAuthenticatedRequest, res: Response) => {
        try {
            const { planId } = req.params;
            const { percentage, startsAt, endsAt } = req.body;

            // 1️⃣ Validate input
            if (!percentage || typeof percentage !== "number" || percentage < 1 || percentage > 100) {
                return res.status(400).json({ message: "Percentage must be a number between 1 and 100." });
            }

            // Optional: validate dates
            const startDate = startsAt ? new Date(startsAt) : undefined;
            const endDate = endsAt ? new Date(endsAt) : undefined;

            if (startDate && endDate && startDate > endDate) {
                return res.status(400).json({ message: "startsAt cannot be after endsAt." });
            }

            // 2️⃣ Check that plan exists
            const plan = await Plan.findById(planId);
            if (!plan) return res.status(404).json({ message: "Plan not found." });

            // 3️⃣ Optional: deactivate existing active discounts for this plan
            await PlanDiscount.updateMany(
                { planId, active: true },
                { $set: { active: false } }
            );

            // 4️⃣ Create discount
            const discount = await PlanDiscount.create({
                planId,
                percentage,
                startsAt: startDate,
                endsAt: endDate,
                active: true,
                createdAt: new Date()
            });

            return res.status(201).json({
                message: "Discount created successfully",
                discount
            });
        } catch (err: any) {
            console.error(err);
            return res.status(500).json({ message: "Server error", error: err.message });
        }
    };


}
