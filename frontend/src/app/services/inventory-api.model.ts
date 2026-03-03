

// Define the InventoryItem interface
export interface InventoryApiItem {
    inventoryStockId: number;
    quantityOnHand: number;
    reorderLevel: number;
    binLocation: string;
    lotNumber: string;
    expirationDate: string | null;
    beyondUseDate: string | null;
}
