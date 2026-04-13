import { PASSWORD_REGEX, PHONE_REGEX, OTP_REGEX } from "./constants";

export class Validators {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  static isValidPassword(password: string): boolean {
    return PASSWORD_REGEX.test(password);
  }

  static isValidPhone(phone: string): boolean {
    return PHONE_REGEX.test(phone);
  }

  static isValidOTP(otp: string): boolean {
    return OTP_REGEX.test(otp);
  }

  static isValidObjectId(id: string): boolean {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  }

  static isValidName(name: string): boolean {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name);
  }
  static isValidBusinessName(name: string): boolean {
    const businessNameRegex = /^[a-zA-Z0-9\s\-]{3,100}$/;
    return businessNameRegex.test(name);
  }

  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidPastDate(date: Date): boolean {
    return date <= new Date();
  }

  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, "");
  }

  static validatePagination(
    page?: number,
    limit?: number
  ): { page: number; limit: number } {
    const validPage = Math.max(1, Math.floor(page || 1));
    const validLimit = Math.min(100, Math.max(1, Math.floor(limit || 10)));

    return { page: validPage, limit: validLimit };
  }

  static validateSort(
    sortBy?: string,
    sortOrder?: string
  ): { sortBy: string; sortOrder: "asc" | "desc" } {
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "email",
      "firstName",
      "lastName",
      "businessName",
    ];
    const validSortBy = allowedSortFields.includes(sortBy || "")
      ? sortBy!
      : "createdAt";
    const validSortOrder = sortOrder === "asc" ? "asc" : "desc";

    return { sortBy: validSortBy, sortOrder: validSortOrder };
  }

  static isValidCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  static containsProfanity(text: string): boolean {
    const profanityWords = ["spam", "abuse", "inappropriate"]; // Add more as needed
    const lowerText = text.toLowerCase();
    return profanityWords.some((word) => lowerText.includes(word));
  }

  static isValidIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
}

export default Validators;
