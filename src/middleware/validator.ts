import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type Source = "body" | "params" | "query";

export const validate =
    (schema: ZodSchema, source: Source = "body") =>
        (req: Request, res: Response, next: NextFunction) => {
            const result = schema.safeParse(req[source]);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    errors: result.error.issues,
                });
            }

            req[source] = result.data;

            next();
        };