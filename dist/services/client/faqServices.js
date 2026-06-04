"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQService = void 0;
const faqRepository_1 = require("../../repository/admin/faqRepository");
class FAQService {
    constructor() {
        this.faqRepository = new faqRepository_1.FAQRepository();
    }
    async getAllFAQs(params) {
        return await this.faqRepository.findAllWithFilters(params);
    }
}
exports.FAQService = FAQService;
