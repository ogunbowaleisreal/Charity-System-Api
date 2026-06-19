import Banner from "../models/Banner";

class BannerService {

    /**
     * Create Banner
     */
    async createBanner(payload: {
        image: string;
        createdBy: string
        category?: string;
        order?: number;
        link?: string
    }) {
        return await Banner.create(payload);
    }

    /**
     * Get Banner By Id
     */
    async getBannerById(bannerId: string) {
        return await Banner.findById(bannerId);
    }

    /**
     * Admin - Get All Banners
     */
    async getAllBanners(query: any) {
        const {
            page = 1,
            limit = 10,
            category,
            isActive,
        } = query;

        const filter: any = {};

        if (category) {
            filter.category = category;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }

        const skip =
            (Number(page) - 1) * Number(limit);

        const banners = await Banner.find(filter)
            .populate("createdBy", "firstName lastName adminLevel profilePicture")
            .sort({
                order: 1,
                createdAt: -1,
            })
            .skip(skip)
            .limit(Number(limit));

        const total =
            await Banner.countDocuments(filter);

        return {
            banners,
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
     * Client - Get All Active Banners
     */
    async getActiveBanners() {
        return await Banner.find({
            isActive: true,
        }).sort({
            order: 1,
        });
    }

    /**
     * Client/Admin - Get Active Banners By Category
     */
    async getBannersByCategory(
        category: string
    ) {
        return await Banner.find({
            category,
            isActive: true,
        }).sort({
            order: 1,
        });
    }

    /**
     * Update Banner
     */
    async updateBanner(
        bannerId: string,
        payload: {
            image?: string;
            category?: string;
            isActive?: boolean;
            order?: number;
            link?: string
        }
    ) {
        return await Banner.findByIdAndUpdate(
            bannerId,
            payload,
            {
                new: true,
                runValidators: true,
            }
        );
    }

    /**
     * Update Banner Image Only
     */
    async updateBannerImage(
        bannerId: string,
        image: string
    ) {
        return await Banner.findByIdAndUpdate(
            bannerId,
            { image },
            {
                new: true,
            }
        );
    }

    /**
     * Activate Banner
     */
    async activateBanner(
        bannerId: string
    ) {
        return await Banner.findByIdAndUpdate(
            bannerId,
            {
                isActive: true,
            },
            {
                new: true,
            }
        );
    }

    /**
     * Deactivate Banner
     */
    async deactivateBanner(
        bannerId: string
    ) {
        return await Banner.findByIdAndUpdate(
            bannerId,
            {
                isActive: false,
            },
            {
                new: true,
            }
        );
    }

    /**
     * Update Display Order
     */
    async updateBannerOrder(
        bannerId: string,
        order: number
    ) {
        return await Banner.findByIdAndUpdate(
            bannerId,
            {
                order,
            },
            {
                new: true,
            }
        );
    }

    /**
     * Delete Banner
     */
    async deleteBanner(
        bannerId: string
    ) {
        return await Banner.findByIdAndDelete(
            bannerId
        );
    }

    /**
     * Count Banners
     */
    async countBanners() {
        return await Banner.countDocuments();
    }

    /**
     * Count Active Banners
     */
    async countActiveBanners() {
        return await Banner.countDocuments({
            isActive: true,
        });
    }
}

export default new BannerService();