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
        return await this.faqRepository.findAllWithFilters(params);
    }

}