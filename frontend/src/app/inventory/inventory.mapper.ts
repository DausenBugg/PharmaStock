import { InventoryApiItem } from '../models/inventory-api.model';
import { InventoryRow } from './inventory.model';

// inventory.mapper.ts
// This file defines the mapping function that converts InventoryApiItem objects (received from the API) 
// into InventoryRow objects (used in the component).
// The mapInventoryApiToRow function takes an InventoryApiItem as input and returns an InventoryRow,
// mapping the fields accordingly and providing default values for any missing or optional fields.

export function mapInventoryApiToRow(x: InventoryApiItem): InventoryRow {
  return {
    inventoryStockId: x.inventoryStockId,

    // medication details
    medicationId: x.medicationId,
    medicationName: x.medicationName,
    genericName: x.genericName ?? null,
    form: x.form,
    strength: x.strength,
    nationalDrugCode: x.nationalDrugCode,

    lot: x.lotNumber,
    binLocation: x.binLocation,

    quantity: x.quantityOnHand ?? 0,
    reorderPoint: x.reorderLevel ?? 0,

    expiration: x.expirationDate ?? '',
    beyondUseDate: x.beyondUseDate ?? '',

    // Package level inventory tracking fields
    packageNdc: x.packageNdc ?? null,
    packageDescription: x.packageDescription ?? null
    
  };
}