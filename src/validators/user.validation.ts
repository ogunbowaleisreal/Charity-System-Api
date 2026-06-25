import { z } from "zod";

export const updateProfileSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(2)
        .max(50)
        .optional(),

    lastName: z
        .string()
        .trim()
        .min(2)
        .max(50)
        .optional(),

    phoneNumber: z
        .string()
        .trim()
        .regex(
            /^\+?[1-9]\d{7,14}$/,
            "Invalid phone number"
        )
        .optional(),

    gender: z
        .enum(["male", "female"])
        .optional(),

    dateOfBirth: z
        .coerce
        .date()
        .optional(),

    country: z
        .string()
        .trim()
        .max(100)
        .optional(),

    state: z
        .string()
        .trim()
        .max(100)
        .optional(),

    houseAddress: z
        .string()
        .trim()
        .max(255)
        .optional(),

    businessAddress: z
        .string()
        .trim()
        .max(255)
        .optional(),

    companyName: z
        .string()
        .trim()
        .max(255)
        .optional(),

    organizationType: z
        .string()
        .trim()
        .max(100)
        .optional(),

    about: z
        .string()
        .trim()
        .max(1000)
        .optional(),

    profilePicture: z
        .url("Invalid profile picture URL")
        .optional(),

    logo: z
        .url("Invalid logo URL")
        .optional(),

    website: z
        .url("Invalid website URL")
        .optional(),

    instagram: z
        .string()
        .trim()
        .optional(),

    facebook: z
        .string()
        .trim()
        .optional(),

    youtube: z
        .string()
        .trim()
        .optional(),

    snapchat: z
        .string()
        .trim()
        .optional(),

    tiktok: z
        .string()
        .trim()
        .optional(),

    x: z
        .string()
        .trim()
        .optional(),

    visibility: z
        .boolean()
        .optional(),

    twoFactorWithdrawalEnabled: z
        .boolean()
        .optional(),
    twoFactorEnabled: z
        .boolean()
        .optional(),

    bankName: z
        .string()
        .trim()
        .optional(),

    accountName: z
        .string()
        .trim()
        .optional(),

    accountNumber: z
        .string()
        .trim()
        .optional(),

    bankCode: z
        .string()
        .trim()
        .optional(),
}).strict();


export const changePasswordSchema = z
    .object({
        oldPassword: z
            .string()
            .min(1, "Current password is required"),

        newPassword: z
            .string()
            .min(8, "New password must be at least 8 characters"),
    })
    .refine(
        (data) => data.oldPassword !== data.newPassword,
        {
            path: ["newPassword"],
            message:
                "New password must be different from your current password",
        }
    );