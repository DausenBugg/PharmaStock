
// inventory.model.ts
// This file defines the TypeScript interfaces for inventory items and rows, which are used in the InventoryComponent and related services.
// The InventoryItem interface represents the structure of inventory data used in the component, while the InventoryRow interface represents
// the structure of data received from the API, including additional fields for display and potential future use.
export interface InventoryRow {
  inventoryStockId: number;

  medicationId: number;
  medicationName: string;
  genericName: string | null;
  form: string;
  strength: string;
  nationalDrugCode: string;

  // Fields from API
  lot: string;
  binLocation: string;

  quantity: number;
  reorderPoint: number;

  expiration: string;     // display field (ISO string)
  beyondUseDate: string;  // display field (ISO string)

  // Package level inventory tracking fields
  packageNdc?: string | null;
  packageDescription?: string | null;

}