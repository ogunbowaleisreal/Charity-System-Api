"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminDiscountController = void 0;
const Plan_1 = __importDefault(require("../../models/Plan"));
const discount_1 = __importDefault(require("../../models/discount"));
// POST /admin/plans/:planId/discount
class AdminDiscountController {
    constructor() {
        this.createPlanDiscount = async (req, res) => {
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
                const plan = await Plan_1.default.findById(planId);
                if (!plan)
                    return res.status(404).json({ message: "Plan not found." });
                // 3️⃣ Optional: deactivate existing active discounts for this plan
                await discount_1.default.updateMany({ planId, active: true }, { $set: { active: false } });
                // 4️⃣ Create discount
                const discount = await discount_1.default.create({
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
            }
            catch (err) {
                console.error(err);
                return res.status(500).json({ message: "Server error", error: err.message });
            }
        };
    }
}
exports.AdminDiscountController = AdminDiscountController;
