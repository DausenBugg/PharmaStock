import { InventoryApiItem } from '../services/inventory-api.model';
import { InventoryRow } from './inventory.model';

// inventory.mapper.ts
// This file defines the mapping function that converts InventoryApiItem objects (received from the API) 
// into InventoryRow objects (used in the component).
// The mapInventoryApiToRow function takes an InventoryApiItem as input and returns an InventoryRow,
// mapping the fields accordingly and providing default values for any missing or optional fields.

export function mapInventoryApiToRow(x: InventoryApiItem): InventoryRow {
  return {
    inventoryStockId: x.inventoryStockId,
    lot: x.lotNumber,
    binLocation: x.binLocation,
    quantity: x.quantityOnHand,
    reorderPoint: x.reorderLevel,
    expiration: x.expirationDate ?? '',
    beyondUseDate: x.beyondUseDate ?? '',

    // placeholders for fields we might still need to implement in the API
    //brand: '—',
    //generic: '—',
    //leadTime: 0,
    //daysInv: 0
  };
}