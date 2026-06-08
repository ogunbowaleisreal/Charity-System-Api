import { Account } from "../models/Accounts";
import { Announcement } from "../models/Announcement";
import { PushNotificationService } from "./pushNotificationService";
import { ResendEmailService } from "./ResesndServices";
import { EmailService } from "./ResesndServices";
import { AnnouncementTemplates } from "./ResesndServices";

export interface AnnouncementFilter {
    audience:
    | "all_users"
    | "verified_users"
    | "unverified_users"
    | "organizations"
    | "normal_users"
    | "active_users"
    | "suspended_users";

    status?: "pending" | "ongoing" | "successful" | "failed";
    page?: number;
    limit?: number;
    channel?: "push" | "email";
    search?: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
}

export class AnnouncementService {

    private resendService = new ResendEmailService();
    private emailService = new EmailService()
    // private announcementTemplate = new AnnouncementTemplates()

    // CREATE + SEND
    // async createAnnouncement(data: {
    //     title: string;
    //     message: string;

    //     channel: "push" | "email";

    //     audience:
    //     | "all_users"
    //     | "verified_users"
    //     | "unverified_users"
    //     | "organizations"
    //     | "normal_users"
    //     | "active_users"
    //     | "suspended_users"
    //     | "specific";

    //     specificUsers?: string[];

    //     announcementStartAt?: Date;

    //     createdBy: string;
    // }){

    //         const announcement = await Announcement.create({
    //             ...data,
    //             status: "pending",
    //         });

    //         try {

    //             announcement.status = "ongoing";
    //             await announcement.save();

    //             const users = await this.getAudienceUsers(data.audience);

    //             if (!users.length) {
    //                 announcement.status = "failed";
    //                 await announcement.save();

    //                 throw new Error("No users found");
    //             }

    //             // PUSH NOTIFICATION
    //             if (data.channel === "push") {

    //                 for (const user of users) {

    //                     await PushNotificationService.sendToUser(
    //                         user._id.toString(),
    //                         {
    //                             title: data.title,
    //                             body: data.message,
    //                         }
    //                     );
    //                 }
    //             }

    //             // EMAIL
    //             if (data.channel === "email") {

    //                 const emails = users
    //                     .filter(user => user.email)
    //                     .map(user => ({
    //                         to: user.email,
    //                         subject: data.title,
    //                         html: AnnouncementTemplates.announcementTemplate({
    //                             title: data.title,
    //                             message: data.message,

    //                         }),
    //                     }));

    //                 await this.emailService.sendBulkEmails(emails);
    //             }

    //             announcement.status = "successful";
    //             announcement.sentCount = users.length;
    //             announcement.lastSentAt = new Date();

    //             await announcement.save();

    //             return announcement;

    //         } catch (error) {

    //             announcement.status = "failed";

    //             await announcement.save();

    //             throw error;
    //         }
    //     }

    async createAnnouncement(data: {
        title: string;
        message: string;

        channel: "push" | "email";

        audience:
        | "all_users"
        | "verified_users"
        | "unverified_users"
        | "organizations"
        | "normal_users"
        | "active_users"
        | "suspended_users"
        | "specific";

        specificUsers?: string[];

        announcementStartAt?: Date;

        createdBy: string;
    }) {

        if (
            data.audience === "specific" &&
            (!data.specificUsers || !data.specificUsers.length)
        ) {
            throw new Error(
                "specificUsers is required when audience is specific"
            );
        }

        const announcement = await Announcement.create({
            ...data,
            status: "pending",
        }) as any;

        const shouldSendImmediately =
            !data.announcementStartAt ||
            new Date(data.announcementStartAt) <= new Date();

        if (!shouldSendImmediately) {
            return announcement;
        }

        return this.sendAnnouncement(
            announcement._id.toString()
        );
    }

    async sendAnnouncement(
        announcementId: string
    ) {

        const announcement =
            await Announcement.findById(
                announcementId
            );

        if (!announcement) {
            throw new Error(
                "Announcement not found"
            );
        }

        try {

            announcement.status = "ongoing";

            await announcement.save();

            const users =
                await this.getAudienceUsers(
                    announcement.audience,
                    announcement.specificUsers?.map(
                        user => user.toString()
                    )
                );

            if (!users.length) {

                announcement.status = "failed";

                await announcement.save();

                throw new Error(
                    "No users found"
                );
            }

            if (announcement.channel === "push") {

                for (const user of users) {

                    await PushNotificationService.sendToUser(
                        user._id.toString(),
                        {
                            title: announcement.title,
                            body: announcement.message,
                        }
                    );
                }
            }

            if (announcement.channel === "email") {

                const emails = users
                    .filter(user => user.email)
                    .map(user => ({
                        to: user.email,
                        subject: announcement.title,
                        html: AnnouncementTemplates.announcementTemplate({
                            title: announcement.title,
                            message: announcement.message,
                        }),
                    }));

                await this.emailService.sendBulkEmails(
                    emails
                );
            }

            announcement.status =
                "successful";

            announcement.sentCount =
                users.length;

            announcement.lastSentAt =
                new Date();

            await announcement.save();

            return announcement;

        } catch (error) {

            announcement.status = "failed";

            await announcement.save();

            throw error;
        }
    }

    async getAllAnnouncements(query: AnnouncementFilter) {

        const {
            status,
            page = 1,
            limit = 10,
            audience,
            channel,
            search,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = query
        const filter: any = {};

        if (search) {
            filter.$or = [
                { categoryName: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        if (status) filter.status = status;
        if (audience) filter.audience = audience;
        if (channel) filter.channel = channel;

        const sortObj: any = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

        const skip = (Number(page) - 1) * Number(limit);

        const [announcements, totalCount] = await Promise.all([
            Announcement.find(filter)
                .populate("createdBy", "firstName lastName adminLevel profilePicture")
                .sort(sortObj)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Announcement.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalCount / Number(limit));
        const hasNext = Number(page) < totalPages;
        const hasPrev = Number(page) > 1;

        return {
            data: announcements,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalItems: totalCount,
                itemsPerPage: Number(limit),
                hasNext,
                hasPrev,
            },
        };
    }

    // RESEND
    // async resendAnnouncement(announcementId: string) {

    //     const announcement = await Announcement.findById(announcementId);

    //     if (!announcement) {
    //         throw new Error("Announcement not found");
    //     }

    //     return this.createAnnouncement({
    //         title: announcement.title,
    //         message: announcement.message,
    //         channel: announcement.channel,
    //         audience: announcement.audience,
    //         createdBy: announcement.createdBy.toString(),
    //     });
    // }

    async resendAnnouncement(
        announcementId: string,
        //announcementStartAt:Date
    ) {

        const announcement =
            await Announcement.findById(
                announcementId
            );

        if (!announcement) {
            throw new Error(
                "Announcement not found"
            );
        }

        return this.createAnnouncement({
            title: announcement.title,
            message: announcement.message,
            channel: announcement.channel,
            audience: announcement.audience,
            createdBy:
                announcement.createdBy.toString(),

            specificUsers:
                announcement.specificUsers?.map(
                    user => user.toString()
                ),

            // announcementStartAt:
            //     announcement.announcementStartAt,
        });
    }

    // DELETE
    async deleteAnnouncement(announcementId: string) {

        const announcement = await Announcement.findByIdAndDelete(
            announcementId
        );

        if (!announcement) {
            throw new Error("Announcement not found");
        }

        return announcement;
    }

    // GET USERS
    // private async getAudienceUsers(audience: string) {

    //     const query = this.buildAudienceQuery(audience);

    //     return Account.find(query).lean();
    // }
    private async getAudienceUsers(
        audience: string,
        specificUsers?: string[]
    ) {

        if (audience === "specific") {

            return Account.find({
                _id: {
                    $in: specificUsers || [],
                },
            }).lean();
        }

        const query =
            this.buildAudienceQuery(
                audience
            );

        return Account.find(query).lean();
    }

    // FILTER BUILDER
    private buildAudienceQuery(audience: string) {

        switch (audience) {

            case "verified_users":
                return { isVerified: true };

            case "unverified_users":
                return { isVerified: false };

            case "organizations":
                return { role: "organization" };

            case "normal_users":
                return { role: "user" };

            case "active_users":
                return { status: "active" };

            case "suspended_users":
                return { status: "suspended" };
            case "specific":
                return {
                    _id: {
                        $in: [],
                    },
                };

            case "all_users":
            default:
                return {};
        }
    }
}