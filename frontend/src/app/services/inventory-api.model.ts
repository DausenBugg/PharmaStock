

// Define the InventoryItem interface
export interface InventoryApiItem {
    inventoryStockId: number;

    medicationId: number;
    medicationName: string;
    genericName: string | null;

    form: string;
    strength: string;
    nationalDrugCode: string;

    quantityOnHand: number | null;
    reorderLevel: number | null;

    binLocation: string;
    lotNumber: string;

    expirationDate: string | null;
    beyondUseDate: string | null;

    // Package level inventory tracking fields
    packageNdc?: string | null;
    packageDescription?: string | null;
}
