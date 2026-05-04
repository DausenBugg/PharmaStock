export interface PaginationRequest{
    pageNumber: number;
    pageSize: number;

    name?: string;
    lot?: string;

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

    summary: InventorySummary;
}

export interface InventorySummary {
    expired: number;
    expiringSoon: number;
    stockedOut: number;
    lowInventory: number;

}