import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';

import { InventoryService } from './inventory.service';
import { InventoryApiItem } from '../models/inventory-api.model';
import { InventoryRow } from '../inventory/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class MedicationSaveService {
  constructor(private inventoryService: InventoryService) {}

  saveEditedMedicationItem(
    originalItem: InventoryRow,
    formItem: InventoryApiItem
  ): Observable<void> {
    const calls: Array<() => Observable<any>> = [];

    if ((formItem.medicationName ?? '') !== (originalItem.medicationName ?? '')) {
      calls.push(() =>
        this.inventoryService.patchMedication(originalItem.medicationId, {
          name: formItem.medicationName
        })
      );
    }

    if ((formItem.genericName ?? '') !== (originalItem.genericName ?? '')) {
      calls.push(() =>
        this.inventoryService.patchMedication(originalItem.medicationId, {
          genericName: formItem.genericName
        })
      );
    }

    if ((formItem.nationalDrugCode ?? '') !== (originalItem.nationalDrugCode ?? '')) {
      calls.push(() =>
        this.inventoryService.patchMedication(originalItem.medicationId, {
          nationalDrugCode: formItem.nationalDrugCode
        })
      );
    }

    if ((formItem.form ?? '') !== (originalItem.form ?? '')) {
      calls.push(() =>
        this.inventoryService.patchMedication(originalItem.medicationId, {
          form: formItem.form
        })
      );
    }

    if ((formItem.strength ?? '') !== (originalItem.strength ?? '')) {
      calls.push(() =>
        this.inventoryService.patchMedication(originalItem.medicationId, {
          strength: formItem.strength
        })
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