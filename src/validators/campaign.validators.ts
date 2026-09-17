import { z } from "zod";

const objectIdSchema = z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ObjectId"
);

const imageSchema = z.object({
    imageUrl: z.url(),
    thumbnailUrl: z.url(),
});

const donationCardSchema = z.object({
    name: z.string().trim().min(1),
    amount: z.number().positive(),
    dateTime: z.coerce.date(),
});


export const createCampaignSchema = z
    .object({
        category: objectIdSchema,

        title: z
            .string()
            .trim()
            .min(5)
            .max(150),

        description: z
            .string()
            .trim()
            .min(20),

        // thumbnailUrl: z.url(),

        image: z
            .array(imageSchema)
            .min(1),

        tags: z
            .array(objectIdSchema)
            .default([]),

        authors: z
            .array(z.string())
            .default([]),

        targetAmount: z
            .number()
            .positive(),

        opening: z.coerce.date(),

        startImmediately: z.boolean(),

        startDate: z
            .coerce
            .date()
            .optional(),

        endDate: z.coerce.date(),

        allowComments: z.boolean(),

        showDonations: z.boolean(),

        isActive: z.boolean(),

        donationCards: z
            .array(donationCardSchema)
            .optional(),
    })
    .superRefine((data, ctx) => {
        if (
            !data.startImmediately &&
            !data.startDate
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["startDate"],
                message:
                    "startDate is required when startImmediately is false",
            });
        }

        if (
            data.startDate &&
            data.endDate <= data.startDate
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["endDate"],
                message:
                    "End date must be after start date",
            });
        }
    })
    .strict();

export const updateCampaignSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(5)
            .max(150)
            .optional(),

        description: z
            .string()
            .trim()
            .min(20)
            .optional(),

        category: objectIdSchema.optional(),

        targetAmount: z
            .number()
            .positive()
            .optional(),

        tags: z
            .array(objectIdSchema)
            .optional(),

        startDate: z
            .coerce
            .date()
            .optional(),

        endDate: z
            .coerce
            .date()
            .optional(),

        isActive: z
            .boolean()
            .optional(),

        showDonations: z
            .boolean()
            .optional(),

        allowComments: z
            .boolean()
            .optional(),

        image: z
            .array(imageSchema)
            .optional(),
    })
    .strict()
    .refine(
        (data) =>
            !data.startDate || !data.endDate || data.endDate > data.startDate,
        {
            path: ["endDate"],
            message: "End date must be after start date",
        }
    );

export const campaignParamsSchema = z.object({
    campaignId: objectIdSchema,
});


export const campaignFilterSchema = z.object({
    page: z.coerce
        .number()
        .int()
        .positive()
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .positive()
        .max(100)
        .default(10),

    category: objectIdSchema.optional(),

    status: z
        .enum([
            "ongoing",
            "completed",
            "cancelled",
            "draft",
        ])
        .optional(),

    search: z
        .string()
        .trim()
        .optional(),
});

