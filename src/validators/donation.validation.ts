import { z } from "zod";
const objectIdSchema = z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ObjectId"
);

const emailSchema = z
    .email("Invalid email address")
    .trim()
    .toLowerCase();


export const initiateDonationSchema = z
    .object({
        campaignId: objectIdSchema,

        email: emailSchema,

        firstname: z
            .string()
            .trim()
            .min(2)
            .max(50)
            .optional(),

        lastname: z
            .string()
            .trim()
            .min(2)
            .max(50)
            .optional(),

        phoneNumber: z
            .string()
            .trim()
            // .regex(
            //     /^\+?[1-9]\d{7,14}$/,
            //     "Invalid phone number"
            // )
            .optional(),

        amount: z
            .number()
            .positive("Donation amount must be greater than zero"),

        gratuityPercentage: z
            .number()
            .min(0)
            .max(100)
            .default(0),

        donateAnonymously: z
            .boolean()
            .default(false),
    })
    // .superRefine((data, ctx) => {
    //     // Require a name unless donating anonymously
    //     if (!data.donateAnonymously) {
    //         if (!data.firstname) {
    //             ctx.addIssue({
    //                 code: "custom",
    //                 path: ["firstname"],
    //                 message: "First name is required",
    //             });
    //         }

    //         if (!data.lastname) {
    //             ctx.addIssue({
    //                 code: "custom",
    //                 path: ["lastname"],
    //                 message: "Last name is required",
    //             });
    //         }
    //     }
    // })
    .strict();