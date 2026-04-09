import logger from "../../logger";
import Admin from "../../models/AdminModel";
import bcryptUtil from "../../utils/bcryptutils";
import { HTTP_STATUS } from "../../utils/constants";

interface UpdateProfileData {
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    phone?: string;
    // NEW optional personal fields
    about?: string;
    gender?: "male" | "female" | "other" | "prefer_not_to_say";
    homeAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
    cityOfResidence?: string;
    stateOfResidence?: string;
    countryOfResidence?: string;
    stateOfOrigin?: string;
    countryOfOrigin?: string;
}

export class ProfileService {
    async changePassword(
        adminId: string,
        newPassword: string,
        currentPassword: string
    ) {
        const admin = await Admin.findById(adminId).select(
            "+password +passwordHistory"
        );
        if (!admin) {
            throw { message: "Admin not found", statusCode: HTTP_STATUS.NOT_FOUND };
        }

        const isCurrentPasswordValid = await admin.comparePassword(currentPassword);

        if (!isCurrentPasswordValid) {
            throw {
                message: "Current password is incorrect",
                statusCode: HTTP_STATUS.BAD_REQUEST,
            };
        }

        if (
            await bcryptUtil.isPasswordInHistory(newPassword, admin.passwordHistory)
        ) {
            throw {
                message: "Cannot reuse recent passwords",
                statusCode: HTTP_STATUS.BAD_REQUEST,
            };
        }

        //Update password
        admin.password = newPassword;

        const hashedPassword = await bcryptUtil.hashPassword(newPassword);
        admin.passwordHistory = bcryptUtil.updatePasswordHistory(
            admin.passwordHistory,
            hashedPassword
        );
        admin.updatedAt = new Date();
        await admin.save();

        logger.info("Admin password changed", { adminId });
    }

    async fetchProfile(adminId: string) {
        const profile = await Admin.findById(adminId).lean();
        return profile;
    }

    async updateAdminProfile(userId: string, data: UpdateProfileData) {
        const admin = await Admin.findById(userId);
        if (!admin) {
            throw { message: "Admin not found", statusCode: HTTP_STATUS.NOT_FOUND };
        }

        // Basic fields
        if (data.firstName !== undefined) admin.firstName = data.firstName;
        if (data.lastName !== undefined) admin.lastName = data.lastName;
        if (data.phone !== undefined) admin.phone = data.phone;
        if (data.profilePicture !== undefined) admin.profilePicture = data.profilePicture;

        // Personal fields
        if (data.about !== undefined) admin.about = data.about;
        if (data.gender !== undefined) admin.gender = data.gender;

        // Address object
        if (data.homeAddress !== undefined) {
            if (!admin.homeAddress || typeof admin.homeAddress !== "object") {
                admin.homeAddress = {};
            }
            if (data.homeAddress.street !== undefined)
                admin.homeAddress.street = data.homeAddress.street;

            if (data.homeAddress.city !== undefined)
                admin.homeAddress.city = data.homeAddress.city;

            if (data.homeAddress.state !== undefined)
                admin.homeAddress.state = data.homeAddress.state;

            if (data.homeAddress.country !== undefined)
                admin.homeAddress.country = data.homeAddress.country;

            if (data.homeAddress.zipCode !== undefined)
                admin.homeAddress.zipCode = data.homeAddress.zipCode;
        }

        // Residence / origin fields
        if (data.cityOfResidence !== undefined)
            admin.cityOfResidence = data.cityOfResidence;

        if (data.stateOfResidence !== undefined)
            admin.stateOfResidence = data.stateOfResidence;

        if (data.countryOfResidence !== undefined)
            admin.countryOfResidence = data.countryOfResidence;

        if (data.stateOfOrigin !== undefined)
            admin.stateOfOrigin = data.stateOfOrigin;

        if (data.countryOfOrigin !== undefined)
            admin.countryOfOrigin = data.countryOfOrigin;

        admin.updatedAt = new Date();
        await admin.save();

        return admin;
    }


    // async updateAdminProfile(userId: string, data: UpdateProfileData) {
    //     const admin = await Admin.findById(userId);
    //     if (!admin) {
    //         throw { message: "Admin not found", statusCode: HTTP_STATUS.NOT_FOUND };
    //     }

    //     // Update fields if provided
    //     if (data.firstName) admin.firstName = data.firstName;
    //     if (data.lastName) admin.lastName = data.lastName;
    //     if (data.phone) admin.phone = data.phone;
    //     if (data.profilePicture) admin.profilePicture = data.profilePicture;

    //     // NEW: optional fields from the image
    //     if ("about" in data) admin.about = data.about;
    //     if ("gender" in data) admin.gender = data.gender;

    //     if ("homeAddress" in data) {
    //         // ensure existing object exists
    //         admin.homeAddress = data.homeAddress;
    //         if (!admin.homeAddress) admin.homeAddress = {};
    //         const ha = data.homeAddress || {};
    //         if ("street" in ha) admin.homeAddress.street = ha.street;
    //         if ("city" in ha) admin.homeAddress.city = ha.city;
    //         if ("state" in ha) admin.homeAddress.state = ha.state;
    //         if ("country" in ha) admin.homeAddress.country = ha.country;
    //         if ("zipCode" in ha) admin.homeAddress.zipCode = ha.zipCode;
    //     }

    //     if ("cityOfResidence" in data) admin.cityOfResidence = data.cityOfResidence;
    //     if ("stateOfResidence" in data) admin.stateOfResidence = data.stateOfResidence;
    //     if ("countryOfResidence" in data) admin.countryOfResidence = data.countryOfResidence;
    //     if ("stateOfOrigin" in data) admin.stateOfOrigin = data.stateOfOrigin;
    //     if ("countryOfOrigin" in data) admin.countryOfOrigin = data.countryOfOrigin;

    //     admin.updatedAt = new Date();
    //     await admin.save();

    //     return admin;
    // }

    async enable2FA(adminId: string) {
        const admin = await Admin.findByIdAndUpdate(
            adminId,
            {
                twoFactorEnabled: true,
                updatedAt: new Date(),
            },
            { new: true }
        ).lean();

        return { success: true, admin, message: "2FA enable successfully" };
    }

    async disable2FA(adminId: string) {
        const admin = await Admin.findByIdAndUpdate(
            adminId,
            {
                twoFactorEnabled: false,
                updatedAt: new Date(),
            },
            { new: true }
        ).lean();

        return { success: true, message: "2FA disabled successfully", admin };
    }
}

// import logger from "../../logger";
// import Admin from "../../models/AdminModel";
// import bcryptUtil from "../../utils/bcryptutils";
// import { HTTP_STATUS } from "../../utils/constants";

// interface UpdateProfileData {
//     firstName: string;
//     lastName: string;
//     profilePicture?: string;
//     phone: string;
// }

// export class ProfileService {
//     async changePassword(
//         adminId: string,
//         newPassword: string,
//         currentPassword: string
//     ) {
//         const admin = await Admin.findById(adminId).select(
//             "+password +passwordHistory"
//         );
//         if (!admin) {
//             throw { message: "Admin not found", statusCode: HTTP_STATUS.NOT_FOUND };
//         }

//         const isCurrentPasswordValid = await admin.comparePassword(currentPassword);

//         if (!isCurrentPasswordValid) {
//             throw {
//                 message: "Current password is incorrect",
//                 statusCode: HTTP_STATUS.BAD_REQUEST,
//             };
//         }

//         if (
//             await bcryptUtil.isPasswordInHistory(newPassword, admin.passwordHistory)
//         ) {
//             throw {
//                 message: "Cannot reuse recent passwords",
//                 statusCode: HTTP_STATUS.BAD_REQUEST,
//             };
//         }

//         //Update password
//         admin.password = newPassword;

//         const hashedPassword = await bcryptUtil.hashPassword(newPassword);
//         admin.passwordHistory = bcryptUtil.updatePasswordHistory(
//             admin.passwordHistory,
//             hashedPassword
//         );
//         admin.updatedAt = new Date();
//         await admin.save();

//         logger.info("Admin password changed", { adminId });
//     }

//     async fetchProfile(adminId: string) {
//         const profile = await Admin.findById(adminId).lean();
//         return profile;
//     }

//     async updateAdminProfile(userId: string, data: UpdateProfileData) {
//         const admin = await Admin.findById(userId);
//         if (!admin) {
//             throw { message: "Admin not found", statusCode: HTTP_STATUS.NOT_FOUND };
//         }

//         // Update fields if provided
//         if (data.firstName) admin.firstName = data.firstName;
//         if (data.lastName) admin.lastName = data.lastName;
//         if (data.phone) admin.phone = data.phone;
//         if (data.profilePicture) admin.profilePicture = data.profilePicture;

//         admin.updatedAt = new Date();
//         await admin.save();

//         return admin;
//     }

//     async enable2FA(adminId: string) {
//         await Admin.findByIdAndUpdate(
//             adminId,
//             {
//                 twoFactorEnabled: true,
//                 updatedAt: new Date(),
//             },
//             { new: true }
//         );

//         return { success: true, message: "2FA enable successfully" };
//     }

//     async disable2FA(adminId: string) {
//         await Admin.findByIdAndUpdate(
//             adminId,
//             {
//                 twoFactorEnabled: false,
//                 updatedAt: new Date(),
//             },
//             { new: true }
//         );

//         return { success: true, message: "2FA disabled successfully" };
//     }
// }
