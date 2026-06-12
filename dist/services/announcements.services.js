"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementService = void 0;
const Accounts_1 = require("../models/Accounts");
const Announcement_1 = require("../models/Announcement");
const pushNotificationService_1 = require("./pushNotificationService");
const ResesndServices_1 = require("./ResesndServices");
const ResesndServices_2 = require("./ResesndServices");
const ResesndServices_3 = require("./ResesndServices");
class AnnouncementService {
    constructor() {
        this.resendService = new ResesndServices_1.ResendEmailService();
        this.emailService = new ResesndServices_2.EmailService();
    }
    async createAnnouncement(data) {
        if (data.audience === "specific" &&
            (!data.specificUsers || !data.specificUsers.length)) {
            throw new Error("specificUsers is required when audience is specific");
        }
        const announcement = await Announcement_1.Announcement.create({
            ...data,
            status: "pending",
        });
        const shouldSendImmediately = !data.announcementStartAt ||
            new Date(data.announcementStartAt) <= new Date();
        if (!shouldSendImmediately) {
            return announcement;
        }
        return this.sendAnnouncement(announcement._id.toString());
    }
    async sendAnnouncement(announcementId) {
        const announcement = await Announcement_1.Announcement.findById(announcementId);
        if (!announcement) {
            throw new Error("Announcement not found");
        }
        try {
            announcement.status = "ongoing";
            await announcement.save();
            const users = await this.getAudienceUsers(announcement.audience, announcement.specificUsers?.map(user => user.toString()));
            if (!users.length) {
                announcement.status = "failed";
                await announcement.save();
                throw new Error("No users found");
            }
            if (announcement.channel === "push") {
                for (const user of users) {
                    await pushNotificationService_1.PushNotificationService.sendToUser(user._id.toString(), {
                        title: announcement.title,
                        body: announcement.message,
                    });
                }
            }
            if (announcement.channel === "email") {
                const emails = users
                    .filter(user => user.email)
                    .map(user => ({
                    to: user.email,
                    subject: announcement.title,
                    html: ResesndServices_3.AnnouncementTemplates.announcementTemplate({
                        title: announcement.title,
                        message: announcement.message,
                    }),
                }));
                await this.emailService.sendBulkEmails(emails);
            }
            announcement.status =
                "successful";
            announcement.sentCount =
                users.length;
            announcement.lastSentAt =
                new Date();
            await announcement.save();
            return announcement;
        }
        catch (error) {
            announcement.status = "failed";
            await announcement.save();
            throw error;
        }
    }
    async getAllAnnouncements(query) {
        const { status, page = 1, limit = 10, audience, channel, search, sortBy = "createdAt", sortOrder = "desc", } = query;
        const filter = {};
        if (search) {
            filter.$or = [
                { categoryName: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        if (status)
            filter.status = status;
        if (audience)
            filter.audience = audience;
        if (channel)
            filter.channel = channel;
        const sortObj = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;
        const skip = (Number(page) - 1) * Number(limit);
        const [announcements, totalCount] = await Promise.all([
            Announcement_1.Announcement.find(filter)
                .populate("createdBy", "firstName lastName adminLevel profilePicture")
                .sort(sortObj)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Announcement_1.Announcement.countDocuments(filter),
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
    async resendAnnouncement(announcementId) {
        const announcement = await Announcement_1.Announcement.findById(announcementId);
        if (!announcement) {
            throw new Error("Announcement not found");
        }
        return this.createAnnouncement({
            title: announcement.title,
            message: announcement.message,
            channel: announcement.channel,
            audience: announcement.audience,
            createdBy: announcement.createdBy.toString(),
            specificUsers: announcement.specificUsers?.map(user => user.toString()),
            // announcementStartAt:
            //     announcement.announcementStartAt,
        });
    }
    // DELETE
    async deleteAnnouncement(announcementId) {
        const announcement = await Announcement_1.Announcement.findByIdAndDelete(announcementId);
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
    async getAudienceUsers(audience, specificUsers) {
        if (audience === "specific") {
            return Accounts_1.Account.find({
                _id: {
                    $in: specificUsers || [],
                },
            }).lean();
        }
        const query = this.buildAudienceQuery(audience);
        return Accounts_1.Account.find(query).lean();
    }
    // FILTER BUILDER
    buildAudienceQuery(audience) {
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
            case "subscribed_users":
                return { emailSubscribed: true };
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
exports.AnnouncementService = AnnouncementService;
