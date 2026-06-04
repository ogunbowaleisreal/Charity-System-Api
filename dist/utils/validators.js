"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validators = void 0;
const constants_1 = require("./constants");
class Validators {
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static isValidPassword(password) {
        return constants_1.PASSWORD_REGEX.test(password);
    }
    static isValidPhone(phone) {
        return constants_1.PHONE_REGEX.test(phone);
    }
    static isValidOTP(otp) {
        return constants_1.OTP_REGEX.test(otp);
    }
    static isValidObjectId(id) {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        return objectIdRegex.test(id);
    }
    static isValidName(name) {
        const nameRegex = /^[a-zA-Z\s]{2,50}$/;
        return nameRegex.test(name);
    }
    static isValidBusinessName(name) {
        const businessNameRegex = /^[a-zA-Z0-9\s\-]{3,100}$/;
        return businessNameRegex.test(name);
    }
    static isValidURL(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    static isValidPastDate(date) {
        return date <= new Date();
    }
    static sanitizeString(input) {
        return input.trim().replace(/[<>]/g, "");
    }
    static validatePagination(page, limit) {
        const validPage = Math.max(1, Math.floor(page || 1));
        const validLimit = Math.min(100, Math.max(1, Math.floor(limit || 10)));
        return { page: validPage, limit: validLimit };
    }
    static validateSort(sortBy, sortOrder) {
        const allowedSortFields = [
            "createdAt",
            "updatedAt",
            "email",
            "firstName",
            "lastName",
            "businessName",
        ];
        const validSortBy = allowedSortFields.includes(sortBy || "")
            ? sortBy
            : "createdAt";
        const validSortOrder = sortOrder === "asc" ? "asc" : "desc";
        return { sortBy: validSortBy, sortOrder: validSortOrder };
    }
    static isValidCoordinates(lat, lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }
    static isValidTimeFormat(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }
    static containsProfanity(text) {
        const profanityWords = ["spam", "abuse", "inappropriate"]; // Add more as needed
        const lowerText = text.toLowerCase();
        return profanityWords.some((word) => lowerText.includes(word));
    }
    static isValidIP(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }
}
exports.Validators = Validators;
exports.default = Validators;
