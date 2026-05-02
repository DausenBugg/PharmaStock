export interface PaginationRequest{
    pageNumber: number;
    pageSize: number;

    //optional
    search?: string;
    expired?: boolean;
    expiringSoon?: boolean;
    stockedOut?: boolean;
    lowInventory?: boolean;
}

export interface PagedResponse<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalItemCount: number;
    totalPages: number;
}