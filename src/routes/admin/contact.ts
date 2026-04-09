import logger from "../../logger";
import { authorize, verifyAdminToken } from "../../middleware/adminAuth";
import { Contact } from "../../models/Contact";
import { ADMIN_PERMISSIONS, AdminAuthenticatedRequest } from "../../types/admin.management";
import { HTTP_STATUS } from "../../utils/constants";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/helpers";
import { Router } from "express";

const router = Router();

router.use(verifyAdminToken as any);

/**
 * Format international Nigerian number to local (234xxxxxxxxxx → 0xxxxxxxxxx)
 */
export const formatToLocal = (input?: string): string | undefined => {
    if (!input) return input;

    const digits = input.replace(/\D/g, "");

    if (digits.startsWith("234") && digits.length === 13) {
        return "0" + digits.slice(3);
    }

    if (digits.startsWith("0") && digits.length === 11) {
        return digits;
    }

    return input;
};

/**
 * UPDATE CONTACT
 */
router.put(
    "/",
    authorize([ADMIN_PERMISSIONS.SUPPORT.UPDATE]),
    async (req: AdminAuthenticatedRequest, res) => {
        try {
            const { phoneNumber, whatsappNumber, emailAddress } = req.body;

            if (!phoneNumber && !whatsappNumber && !emailAddress) {
                return sendErrorResponse(
                    res,
                    "At least one contact field (phone number, WhatsApp number, or email address) must be provided",
                    HTTP_STATUS.BAD_REQUEST
                );
            }

            // Build dynamic update object
            const updateData: Partial<{
                phoneNumber: string;
                whatsappNumber: string;
                emailAddress: string;
            }> = {};

            if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
            if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
            if (emailAddress !== undefined) updateData.emailAddress = emailAddress;

            const result = await Contact.findOneAndUpdate(
                {},
                { $set: updateData },
                { upsert: true, new: true }
            );

            const formattedContact = {
                ...result.toObject(),
                phoneNumber: formatToLocal(result.phoneNumber),
                whatsappNumber: formatToLocal(result.whatsappNumber),
            };

            sendSuccessResponse(
                res,
                formattedContact,
                "Contact information updated successfully"
            );
        } catch (error: any) {
            logger.error("Error updating contact information", {
                error: error.message,
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
            });

            sendErrorResponse(
                res,
                "Error updating contact information",
                HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    }
);

/**
 * GET CONTACT
 */
router.get(
    "/",
    authorize([ADMIN_PERMISSIONS.SUPPORT.VIEW]),
    async (req: AdminAuthenticatedRequest, res) => {
        try {
            const result = await Contact.findOne({});

            if (!result) {
                return sendErrorResponse(
                    res,
                    "Kindly create contact information first",
                    HTTP_STATUS.NOT_FOUND
                );
            }

            const formattedContact = {
                ...result.toObject(),
                phoneNumber: formatToLocal(result.phoneNumber),
                whatsappNumber: formatToLocal(result.whatsappNumber),
            };

            sendSuccessResponse(
                res,
                formattedContact,
                "Contact information retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Error retrieving contact information", {
                error: error.message,
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
            });

            sendErrorResponse(
                res,
                "Error retrieving contact information",
                HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    }
);

export default router;

// import logger from "../../logger";
// import { authorize, verifyAdminToken } from "../../middleware/adminAuth";
// //import { validateRequest } from "@/middleware/validation";
// import { Contact } from "../../models/Contact";
// import { ADMIN_PERMISSIONS, AdminAuthenticatedRequest } from "../../types/admin.management";
// import { HTTP_STATUS } from "../../utils/constants";
// import { sendErrorResponse, sendSuccessResponse } from "../../utils/helpers";
// import { Router } from "express";
// //import Joi from "joi";

// const router = Router();

// router.use(verifyAdminToken as any);


// export const formatToLocal = (input: string | number | (string | number)[]): string | string[] => {
//     if (!input) return input as any;

//     // Helper for a single number/string
//     const formatSingle = (num: string | number): string => {
//         const str = num.toString().replace(/\D/g, "");

//         if (str.startsWith("234") && str.length === 13) {
//             return "0" + str.slice(3);
//         }
//         if (str.startsWith("0") && str.length === 11) {
//             return str;
//         }
//         return num.toString();
//     };

//     // If it's an array, format each element
//     if (Array.isArray(input)) {
//         return input.map(formatSingle);
//     }

//     // Otherwise, format single value
//     return formatSingle(input);
// };
// router.put(
//     "/",
//     // validateRequest(contactValidationSchema),
//     authorize([ADMIN_PERMISSIONS.SUPPORT.UPDATE]),
//     async (req: AdminAuthenticatedRequest, res) => {
//         try {
//             const { phoneNumber, whatsappNumber, emailAddress } = req.body;

//             if (!phoneNumber && !whatsappNumber && !emailAddress) {
//                 sendErrorResponse(
//                     res,
//                     "At least one contact field (phone number, WhatsApp number, or email address) must be provided",
//                     HTTP_STATUS.BAD_REQUEST
//                 );
//             }

//             // Utility to normalize into arrays (if not already)
//             const toArray = (value: any) => {
//                 if (value === undefined || value === null) return undefined;
//                 return Array.isArray(value) ? value : [value];
//             };

//             // Build dynamic update object (only include provided fields)
//             const updateData: any = {};
//             if (phoneNumber !== undefined) updateData.phoneNumber = toArray(phoneNumber);
//             if (whatsappNumber !== undefined) updateData.whatsappNumber = toArray(whatsappNumber);
//             if (emailAddress !== undefined) updateData.emailAddress = toArray(emailAddress);

//             const result = await Contact.findOneAndUpdate(
//                 {},
//                 { $set: updateData }, // replace only provided fields
//                 { upsert: true, new: true }
//             );

//             const formattedContact = {
//                 ...result.toObject(),
//                 phoneNumber: formatToLocal(result.phoneNumber),
//                 whatsappNumber: formatToLocal(result.whatsappNumber),
//             };

//             sendSuccessResponse(
//                 res,
//                 formattedContact,
//                 "Contact information updated successfully"
//             );
//         } catch (error: any) {
//             sendErrorResponse(
//                 res,
//                 "Error updating contact information",
//                 HTTP_STATUS.INTERNAL_SERVER_ERROR
//             );
//             logger.error("Error updating contact information", {
//                 error: error.message,
//                 adminId: req.admin?.id,
//                 adminEmail: req.admin?.email,
//             });
//         }
//     }
// );




// router.get("/",
//     authorize([ADMIN_PERMISSIONS.SUPPORT.VIEW]),
//     async (req: AdminAuthenticatedRequest, res) => {
//         try {
//             const result = await Contact.findOne({});

//             if (!result) {
//                 sendErrorResponse(
//                     res,
//                     "Kindly create contact information first",
//                     HTTP_STATUS.NOT_FOUND
//                 );
//                 return;
//             }

//             const formattedContact = {
//                 ...result.toObject(),
//                 phoneNumber: formatToLocal(result.phoneNumber),
//                 whatsappNumber: formatToLocal(result.whatsappNumber),
//             };

//             sendSuccessResponse(
//                 res,
//                 formattedContact,
//                 "Contact information retrieved successfully"
//             );
//         } catch (error: any) {
//             sendErrorResponse(
//                 res,
//                 "Error retrieving contact information",
//                 HTTP_STATUS.INTERNAL_SERVER_ERROR
//             );
//             logger.error("Error retrieving contact information", {
//                 error: error.message,
//                 adminId: req.admin?.id,
//                 adminEmail: req.admin?.email,
//             });
//         }
//     });

// export default router;
