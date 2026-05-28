import { Bank } from "../../models/Banks";
import { Request, Response } from "express";
import logger from "../../logger";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";


export class BankController {
    async getBanks(req: Request, res: Response) {
        const banks = await Bank.find({
            isActive: true,
        })
            .sort({ name: 1 })
            .select("name code");

        return sendSuccessResponse(
            res,
            banks,
            "Banks fetched successfully"
        );
    }
}