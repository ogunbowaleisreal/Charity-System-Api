import {
    //     FAQQueryParams,
    //     CreateFAQData,
    //     UpdateFAQData,
    FAQRepository,
} from "../../repository/admin/faqRepository";
import { FAQ } from "../../models/FAQ";
export interface CreateFAQData {
    question: string;
    answer: string;
    category: string;
    isPublished?: boolean;
}

export interface UpdateFAQData {
    question?: string;
    answer?: string;
    category?: string;
    isPublished?: boolean;
}

export interface FAQQueryParams {
    page?: number;
    limit?: number;
    category?: string;
    isPublished?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
}


export class FAQService {
    private faqRepository = new FAQRepository();

    async getAllFAQs(params: FAQQueryParams) {
        return await this.faqRepository.adminfindAllWithFilters(params);
    }

    async getFAQById(id: string) {
        const faq = await this.faqRepository.findById(id);
        if (!faq) {
            throw { message: "FAQ not found", statusCode: 404 };
        }
        return faq;
    }

    async createFAQ(data: CreateFAQData) {
        return await this.faqRepository.create(data);
    }

    async updateFAQ(id: string, data: UpdateFAQData) {
        const faq = await this.faqRepository.findByIdAndUpdate(id, data);
        if (!faq) {
            throw { message: "FAQ not found", statusCode: 404 };
        }
        return faq;
    }

    async deleteFAQ(id: string) {
        const result = await this.faqRepository.findByIdAndDelete(id);
        if (!result) {
            throw { message: "FAQ not found", statusCode: 404 };
        }
        return result;
    }

    async getFAQStatistics() {
        return await this.faqRepository.getStatistics();
    }

    async getFAQCategories() {
        return await this.faqRepository.getCategories();
    }
}


