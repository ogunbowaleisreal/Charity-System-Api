// 
import { Request, Response, NextFunction } from "express";
import { Validators } from "../utils/validators";

const HTML_ALLOWED_FIELDS = ["body"];

export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        if (HTML_ALLOWED_FIELDS.includes(key)) {
          // leave HTML content untouched
          continue;
        }

        req.body[key] = Validators.sanitizeString(req.body[key]);
      }
    }
  }

  next();
};
