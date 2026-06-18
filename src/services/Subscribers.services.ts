// services/subscriber.service.ts

import Subscriber from "../models/Subscriber";

export class SubscriberService {

    /**
     * Subscribe an email
     */
    async subscribe(email: string) {
        const normalizedEmail =
            email.trim().toLowerCase();

        const existingSubscriber =
            await Subscriber.findOne({
                email: normalizedEmail,
            });

        if (existingSubscriber) {

            if (!existingSubscriber.isSubscribed) {
                existingSubscriber.isSubscribed = true;
                existingSubscriber.unsubscribedAt = undefined;

                await existingSubscriber.save();
            }

            return existingSubscriber;
        }

        return await Subscriber.create({
            email: normalizedEmail,
            isSubscribed: true,
            subscribedAt: new Date(),
        });
    }

    /**
     * Unsubscribe an email
     */
    async unsubscribe(email: string) {
        const normalizedEmail =
            email.trim().toLowerCase();

        return await Subscriber.findOneAndUpdate(
            {
                email: normalizedEmail,
            },
            {
                isSubscribed: false,
                unsubscribedAt: new Date(),
            },
            {
                new: true,
            }
        );
    }

    /**
     * Get subscriber by email
     */
    async getSubscriberByEmail(
        email: string
    ) {
        return await Subscriber.findOne({
            email: email.trim().toLowerCase(),
        });
    }

    /**
     * Check if email is subscribed
     */
    async isSubscribed(email: string) {
        const subscriber =
            await Subscriber.findOne({
                email: email.trim().toLowerCase(),
                isSubscribed: true,
            });

        return !!subscriber;
    }

    /**
     * Admin - Get all subscribers
     */
    async getSubscribers(query: any) {
        const {
            page = 1,
            limit = 20,
            search,
            isSubscribed,
        } = query;

        const filter: any = {};

        if (search) {
            filter.email = {
                $regex: search,
                $options: "i",
            };
        }

        if (
            isSubscribed !== undefined
        ) {
            filter.isSubscribed =
                isSubscribed === "true";
        }

        const skip =
            (Number(page) - 1) *
            Number(limit);

        const subscribers =
            await Subscriber.find(filter)
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(Number(limit));

        const total =
            await Subscriber.countDocuments(
                filter
            );

        return {
            subscribers,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(
                    total / Number(limit)
                ),
            },
        };
    }

    /**
     * Admin - Get active subscribers only
     */
    async getActiveSubscribers() {
        return await Subscriber.find({
            isSubscribed: true,
        }).sort({
            createdAt: -1,
        });
    }

    /**
     * Admin - Get unsubscribed users
     */
    async getUnsubscribedSubscribers() {
        return await Subscriber.find({
            isSubscribed: false,
        }).sort({
            createdAt: -1,
        });
    }

    /**
     * Admin - Get subscriber by id
     */
    async getSubscriberById(
        subscriberId: string
    ) {
        return await Subscriber.findById(
            subscriberId
        );
    }

    /**
     * Admin - Delete subscriber
     */
    async deleteSubscriber(
        subscriberId: string
    ) {
        return await Subscriber.findByIdAndDelete(
            subscriberId
        );
    }

    /**
     * Admin - Resubscribe user
     */
    async resubscribeSubscriber(
        subscriberId: string
    ) {
        return await Subscriber.findByIdAndUpdate(
            subscriberId,
            {
                isSubscribed: true,
                unsubscribedAt: undefined,
            },
            {
                new: true,
            }
        );
    }

    /**
     * Admin - Force unsubscribe
     */
    async forceUnsubscribe(
        subscriberId: string
    ) {
        return await Subscriber.findByIdAndUpdate(
            subscriberId,
            {
                isSubscribed: false,
                unsubscribedAt: new Date(),
            },
            {
                new: true,
            }
        );
    }

    /**
     * Dashboard Stats
     */
    async getSubscriberStats() {

        const [
            totalSubscribers,
            activeSubscribers,
            unsubscribedSubscribers,
        ] = await Promise.all([
            Subscriber.countDocuments(),
            Subscriber.countDocuments({
                isSubscribed: true,
            }),
            Subscriber.countDocuments({
                isSubscribed: false,
            }),
        ]);

        return {
            totalSubscribers,
            activeSubscribers,
            unsubscribedSubscribers,
        };
    }

    /**
     * Export list for newsletters
     */
    async getNewsletterEmails() {

        const subscribers =
            await Subscriber.find(
                {
                    isSubscribed: true,
                },
                {
                    email: 1,
                    _id: 0,
                }
            );

        return subscribers.map(
            (subscriber) =>
                subscriber.email
        );
    }
}

export default new SubscriberService();