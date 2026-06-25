import { z } from "zod";

/**
 * Shared fields
 */

const emailSchema = z
    .email("Invalid email address")
    .trim()
    .toLowerCase();

const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters");

const otpSchema = z
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers");


export const verifyOtpSchema = z.object({
    email: emailSchema,
    otp: otpSchema,
});


export const passwordResetOtpSchema = z.object({
    email: emailSchema,
});

export const resendOtpSchema = z.object({
    email: emailSchema,
});


export const resend2FAOtpSchema = z.object({
    email: emailSchema,
});

export const verifyPasswordResetOtpSchema = z.object({
    email: emailSchema,
    otp: otpSchema,
});

export const resetPasswordSchema = z.object({
    email: emailSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
});

export const verifyAndResetPasswordSchema = z.object({
    email: emailSchema,
    newPassword: passwordSchema,
});



export const verify2FASchema = z.object({
    email: emailSchema,
    otp: otpSchema,
});

export const registerSchema = z
    .object({
        firstName: z
            .string()
            .trim()
            .min(2, "First name must be at least 2 characters")
            .max(50),

        lastName: z
            .string()
            .trim()
            .min(2, "Last name must be at least 2 characters")
            .max(50),

        userName: z
            .string()
            .trim()
            .min(1)
            .max(30)
            .optional(),

        email: z
            .email("Invalid email address")
            .trim()
            .toLowerCase(),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters"),

        phoneNumber: z
            .string()
            .trim()
            .min(7, "Phone number is too short"),

        gender: z
            .enum(["male", "female"])
            .optional(),

        role: z.enum([
            "user",
            "organization",
        ]),

        companyName: z
            .string()
            .trim()
            .optional(),

        organizationType: z
            .string()
            .trim()
            .optional(),
    })
    .superRefine((data, ctx) => {
        if (data.role === "organization") {
            if (!data.companyName) {
                ctx.addIssue({
                    code: "custom",
                    path: ["companyName"],
                    message:
                        "Company name is required for organizations",
                });
            }

            if (!data.organizationType) {
                ctx.addIssue({
                    code: "custom",
                    path: ["organizationType"],
                    message:
                        "Organization type is required",
                });
            }
        }
    });


export const loginSchema = z.object({
    email: z
        .email("Invalid email address")
        .trim()
        .toLowerCase(),

    password: z
        .string()
        .min(1, "Password is required"),
});