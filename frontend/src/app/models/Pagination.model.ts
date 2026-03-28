export interface PaginationRequest{
    pageNumber: number;
    pageSize: number;
}

export interface PagedResponse<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalItemCount: number;
    totalPages: number;
}