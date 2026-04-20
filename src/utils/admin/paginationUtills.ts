export interface PaginationQuery {
    page?: number;
    limit?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export const buildPagination = (page = 1, limit = 10) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(limit, 100)); // prevent abuse

    return {
        skip: (safePage - 1) * safeLimit,
        limit: safeLimit,
        page: safePage
    };
};

export const formatPagination = <T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResponse<T> => {
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