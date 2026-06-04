"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQService = void 0;
const faqRepository_1 = require("../../repository/admin/faqRepository");
class FAQService {
    constructor() {
        this.faqRepository = new faqRepository_1.FAQRepository();
    }
    async getAllFAQs(params) {
        return await this.faqRepository.adminfindAllWithFilters(params);
    }
    async getFAQById(id) {
        const faq = await this.faqRepository.findById(id);
        if (!faq) {
            throw { message: "FAQ not found", statusCode: 404 };
        }
        return faq;
    }
    async createFAQ(data) {
        return await this.faqRepository.create(data);
    }
    async updateFAQ(id, data) {
        const faq = await this.faqRepository.findByIdAndUpdate(id, data);
        if (!faq) {
            throw { message: "FAQ not found", statusCode: 404 };
        }
        return faq;
    }
    async deleteFAQ(id) {
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
exports.FAQService = FAQService;
