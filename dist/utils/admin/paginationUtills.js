"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPagination = exports.buildPagination = void 0;
const buildPagination = (page = 1, limit = 10) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(limit, 100)); // prevent abuse
    return {
        skip: (safePage - 1) * safeLimit,
        limit: safeLimit,
        page: safePage
    };
};
exports.buildPagination = buildPagination;
const formatPagination = (data, total, page, limit) => {
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    };
};
exports.formatPagination = formatPagination;
