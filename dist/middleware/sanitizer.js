"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = void 0;
const validators_1 = require("../utils/validators");
const HTML_ALLOWED_FIELDS = ["body"];
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        for (const key in req.body) {
            if (typeof req.body[key] === "string") {
                if (HTML_ALLOWED_FIELDS.includes(key)) {
                    // leave HTML content untouched
                    continue;
                }
                req.body[key] = validators_1.Validators.sanitizeString(req.body[key]);
            }
        }
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
