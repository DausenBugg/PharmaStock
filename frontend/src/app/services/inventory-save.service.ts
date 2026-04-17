import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';

import { InventoryService } from './inventory.service';
import { InventoryApiItem } from '../models/inventory-api.model';
import { InventoryRow } from '../inventory/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class InventorySaveService {
  constructor(private inventoryService: InventoryService) {}

  saveEditedInventoryItem(
    originalItem: InventoryRow,
    formItem: InventoryApiItem,
    originalQuantity: number
  ): Observable<void> {
    const calls: Array<() => Observable<any>> = [];

    // Inventory fields
    if ((formItem.expirationDate ?? '') !== (originalItem.expiration ?? '')) {
      calls.push(() =>
        this.inventoryService.patchExpirationDate(
          originalItem.inventoryStockId,
          formItem.expirationDate
        )
      );
    }

    if ((formItem.beyondUseDate ?? '') !== (originalItem.beyondUseDate ?? '')) {
      calls.push(() =>
        this.inventoryService.patchBeyondUseDate(
          originalItem.inventoryStockId,
          formItem.beyondUseDate
        )
      );
    }

    if ((formItem.packageNdc ?? '') !== (originalItem.packageNdc ?? '')) {
      calls.push(() =>
        this.inventoryService.patchPackageNdc(
          originalItem.inventoryStockId,
          formItem.packageNdc ?? null
        )
      );
    }

    if ((formItem.packageDescription ?? '') !== (originalItem.packageDescription ?? '')) {
      calls.push(() =>
        this.inventoryService.patchPackageDescription(
          originalItem.inventoryStockId,
          formItem.packageDescription ?? null
        )
      );
    }

    // Quantity
    const newQuantity = Number(formItem.quantityOnHand ?? 0);
    const oldQuantity = Number(originalQuantity ?? 0);
    const adjustment = newQuantity - oldQuantity;

    if (adjustment !== 0) {
      calls.push(() =>
        this.inventoryService.adjustQuantity(
          originalItem.inventoryStockId,
          adjustment
        )
      );
    }

    if (calls.length === 0) {
      return of(void 0);
    }

    let chain = calls[0]();

    for (let i = 1; i < calls.length; i++) {
      chain = chain.pipe(concatMap(() => calls[i]()));
    }

    return chain.pipe(map(() => void 0));
  }
}