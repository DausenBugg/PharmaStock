
// inventory.model.ts
// This file defines the TypeScript interfaces for inventory items and rows, which are used in the InventoryComponent and related services.
// The InventoryItem interface represents the structure of inventory data used in the component, while the InventoryRow interface represents
// the structure of data received from the API, including additional fields for display and potential future use.
export interface InventoryRow {
  inventoryStockId: number;

  // Fields from API
  lot: string;
  binLocation: string;

  quantity: number;
  reorderPoint: number;

  expiration: string;     // display field (ISO string)
  beyondUseDate: string;  // display field (ISO string)

  // placeholder fields we might need to still implement in the API
  //brand?: string;
  //generic?: string;
  //leadTime?: number;
  //daysInv?: number;
}