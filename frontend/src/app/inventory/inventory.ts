import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HttpErrorResponse } from '@angular/common/http';
import { MatPaginatorModule, MatPaginator } from "@angular/material/paginator";
import { ViewChild } from "@angular/core";

import { PredictionService, ExpirationRisk } from '../services/prediction.service';

// Service + model + mapper
import { InventoryService } from '../services/inventory.service';
import { InventoryRow } from './inventory.model';
import { mapInventoryApiToRow } from './inventory.mapper';
import { InventoryApiItem } from '../services/inventory-api.model';

// Updated for Patch Requests
import { UpdateInventoryStockPatchRequest } from '../services/inventory-api.model';
import { UpdateMedicationPatchRequest } from '../services/inventory-api.model';

// Save service
import { InventorySaveService } from '../services/inventory-save.service';
import { MedicationSaveService } from '../services/medication-save.service';
import { Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatTableModule, 
    MatPaginatorModule
  ],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css']
})
export class InventoryComponent implements AfterViewInit {

  // SEARCH
  searchName = '';
  searchLot = '';

  // TABLE
  displayedColumns: string[] = [
    'edit',
    'medicationName',
    'genericName',
    'nationalDrugCode',
    'form',
    'strength',
    'packageNdc',
    'packageDescription',
    'quantity',
    'reorderPoint',
    'aiRiskScore',
    'binLocation',
    'lot',
    'expiration',
    'beyondUseDate'
  ];

  // DATA
  private allItems: InventoryRow[] = [];
  dataSource = new MatTableDataSource<InventoryRow>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  
  nearExpirationOnly = false;

  // AI risk scores
  riskScores: Map<number, ExpirationRisk> = new Map();

  // ROW SELECTION
  selectedItem: InventoryRow | null = null;

  // MODALS
  showInventoryModal = false;
  showPasswordModal = false;

  // FORM STATE
  editingItem: InventoryRow | null = null;
  formItem: InventoryApiItem = {} as InventoryApiItem;
  rowItem: InventoryRow = {} as InventoryRow;

  originalQuantity = 0;

  passwordInput = '';

  constructor(
    private inventoryService: InventoryService,
    private predictionService: PredictionService,
    private cdr: ChangeDetectorRef,
    private inventorySaveService: InventorySaveService,
    private medicationSaveService: MedicationSaveService
  ) {}

  ngAfterViewInit(): void {
    this.loadInventory();

    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  // -----------------------------
  // LOAD INVENTORY
  // -----------------------------
  
   loadInventory(): void {

    this.inventoryService.getInventoryStocks().subscribe({
      next: (data) => {

        this.allItems = data.map(mapInventoryApiToRow);
        this.dataSource.data = this.allItems;

        // attach paginator
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }

        this.loadRiskScores();

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Inventory load failed:', err);
      }
    });

  }

  // -----------------------------
  // LOAD AI RISK
  // -----------------------------
  private loadRiskScores(): void {

    this.predictionService.getExpirationRisks().subscribe({
      next: (risks) => {
        this.riskScores = new Map(risks.map(r => [r.inventoryStockId, r]));
      }
    });

  }

  getRiskScore(item: InventoryRow): string {

    const risk = this.riskScores.get(item.inventoryStockId);

    if (!risk) return '-';

    return `${(risk.riskScore * 100).toFixed(0)}%`;

  }

  getRiskBadgeClass(item: InventoryRow): string {

    const risk = this.riskScores.get(item.inventoryStockId);

    if (!risk) return '';

    if (risk.riskScore >= 0.75) return 'health-critical';
    if (risk.riskScore >= 0.5) return 'health-warning';

    return '';

  }

  // -----------------------------
  // SEARCH
  // -----------------------------
  onSearch(): void {

    const nameQuery = this.searchName.toLowerCase();
    const lotQuery = this.searchLot.toLowerCase();

    this.dataSource.data = this.allItems.filter(item =>
      (!nameQuery || item.medicationName.toLowerCase().includes(nameQuery) ||
        (item.genericName ?? '').toLowerCase().includes(nameQuery)) &&
      (!lotQuery || item.lot.toLowerCase().includes(lotQuery))
    );

  }

  clearFilters(): void {

    this.searchName = '';
    this.searchLot = '';

    this.dataSource.data = [...this.allItems];

  }

  // -----------------------------
  // ROW SELECT
  // -----------------------------
  onSelectRow(item: InventoryRow, event: any): void {

    if (event.target.checked) {
      this.selectedItem = item;
    } else {
      this.selectedItem = null;
    }

  }

  // -----------------------------
  // OPEN FORM
  // -----------------------------
  openInventoryForm(): void {

    console.log("OPEN INVENTORY MODAL");
    console.log('selectedItem at open:', this.selectedItem)

    if(!this.selectedItem) {
      console.warn('No row selected for editing.');
      return;
    }

    if (this.selectedItem) {

        this.editingItem = this.selectedItem;

        console.log('EDIT MODE');
        console.log('editingItem set to:', this.editingItem);

        this.formItem = {
          inventoryStockId: this.selectedItem.inventoryStockId,
          medicationId: this.selectedItem.medicationId,

          medicationName: this.selectedItem.medicationName,
          genericName: this.selectedItem.genericName,

          nationalDrugCode: this.selectedItem.nationalDrugCode,
          form: this.selectedItem.form,
          strength: this.selectedItem.strength,

          quantityOnHand: this.selectedItem.quantity,
          reorderLevel: this.selectedItem.reorderPoint,

          binLocation: this.selectedItem.binLocation,
          lotNumber: this.selectedItem.lot,

          expirationDate: this.selectedItem.expiration,
          beyondUseDate: this.selectedItem.beyondUseDate,

          packageNdc: this.selectedItem.packageNdc,
          packageDescription: this.selectedItem.packageDescription
        };

        this.originalQuantity = Number(this.selectedItem.quantity);

      } else {

        console.log('CREATE MODE- selectedItem is null');
        this.editingItem = null;

        this.formItem = {
          inventoryStockId: 0,
          medicationId: 0,

          medicationName: '',
          genericName: null,

          nationalDrugCode: '',
          form: '',
          strength: '',

          quantityOnHand: null,
          reorderLevel: null,

          binLocation: '',
          lotNumber: '',

          expirationDate: null,
          beyondUseDate: null,

          packageNdc: null,
          packageDescription: null
        };

      }

    this.showInventoryModal = true;
  }

  cancelInventoryEdit(): void {

    this.showInventoryModal = false;

  }

  // -----------------------------
  // SAVE CLICK
  // -----------------------------
  saveInventory(): void {
    this.showInventoryModal = false;
    this.showPasswordModal = true;
  }

  cancelPassword(): void {

    this.passwordInput = '';
    this.showPasswordModal = false;

  }

  // -----------------------------
  // CONFIRM PASSWORD
  //calls the save function in the inventory save service and medication save service 
  // based on what fields were changed in the form. It constructs the necessary patch requests and chains them  
  // together, ensuring that all changes are saved before reloading the inventory list.
  // it detects changes by comparing the form values to the original item values, and only makes API calls foer the fields that were actually changed.
  // This approach optimizes the save process by minimizing unnecessary API calls and ensuring data integrity.
  // specifically, it checks for changes in medication details (name, generic name, NDC, form, strength) and inventory details (expiration date, beyond use date, package NDC, package description, quantity). and calls the corresponding save functions in the services based on what was changed. After the save operations complete, it calls finishSave to reset the form and reload the inventory list.
  // -----------------------------
 confirmPassword(): void {
    console.log('confirmPassword called');
    console.log('passwordInput:', this.passwordInput);
    console.log('editingItem:', this.editingItem);
    console.log('formItem:', this.formItem);

    if (!this.passwordInput || this.passwordInput.trim() === '') {
      console.log('Password blank, stopping');
      return;
    }

    // -----------------------------
    // CREATE NEW ITEM
    // -----------------------------
    if (!this.editingItem) {
      console.log('Creating new item');

      this.inventoryService
        .createInventoryStocks(this.formItem)
        .subscribe({
          next: (res) => {
            console.log('Create success:', res);
            this.finishSave();
          },
          error: (err) => {
            console.error('Create failed:', err);
          }
        });

      return;
    }

    const item = this.editingItem!;


    // -----------------------------
    // CHANGE DETECTION
    // -----------------------------
    const overrideFieldsChanged =
      (this.formItem.medicationName ?? '') !== (item.medicationName ?? '') ||
      (this.formItem.genericName ?? '') !== (item.genericName ?? '') ||
      (this.formItem.nationalDrugCode ?? '') !== (item.nationalDrugCode ?? '') ||
      (this.formItem.form ?? '') !== (item.form ?? '') ||
      (this.formItem.strength ?? '') !== (item.strength ?? '');

    const inventoryChanged =
      (this.formItem.expirationDate ?? '') !== (item.expiration ?? '') ||
      (this.formItem.beyondUseDate ?? '') !== (item.beyondUseDate ?? '') ||
      (this.formItem.packageNdc ?? '') !== (item.packageNdc ?? '') ||
      (this.formItem.packageDescription ?? '') !== (item.packageDescription ?? '') ||
      Number(this.formItem.quantityOnHand ?? 0) !== Number(this.originalQuantity ?? 0);

    if (!overrideFieldsChanged && !inventoryChanged) {
      console.log('No changes detected.');
      this.finishSave();
      return;
    }

    // -----------------------------
    // OVERRIDE SAVE (ROW LEVEL)
    // -----------------------------
    const runOverrideSave = () => {
      if (!overrideFieldsChanged) return of(void 0);

      const calls: Array<() => any> = [];
      

      if ((this.formItem.medicationName ?? '') !== (item.medicationName ?? '')) {
        calls.push(() =>
          this.inventoryService.patchMedicationNameOverride(
            item.inventoryStockId,
            this.formItem.medicationName
          )
        );
      }

      if ((this.formItem.genericName ?? '') !== (item.genericName ?? '')) {
        calls.push(() =>
          this.inventoryService.patchGenericNameOverride(
            item.inventoryStockId,
            this.formItem.genericName
          )
        );
      }

      if ((this.formItem.nationalDrugCode ?? '') !== (item.nationalDrugCode ?? '')) {
        calls.push(() =>
          this.inventoryService.patchNationalDrugCodeOverride(
            item.inventoryStockId,
            this.formItem.nationalDrugCode
          )
        );
      }

      if ((this.formItem.form ?? '') !== (item.form ?? '')) {
        calls.push(() =>
          this.inventoryService.patchDosageFormOverride(
            item.inventoryStockId,
            this.formItem.form
          )
        );
      }

      if ((this.formItem.strength ?? '') !== (item.strength ?? '')) {
        calls.push(() =>
          this.inventoryService.patchStrengthOverride(
            item.inventoryStockId,
            this.formItem.strength
          )
        );
      }

      if (calls.length === 0) return of(void 0);

      let chain = calls[0]();

      for (let i = 1; i < calls.length; i++) {
        chain = chain.pipe(concatMap(() => calls[i]()));
      }

      return chain;
    };

    // -----------------------------
    // INVENTORY SAVE
    // -----------------------------
    const runInventorySave = () => {
      if (!inventoryChanged) return of(void 0);

      return this.inventorySaveService.saveEditedInventoryItem(
        item,
        this.formItem,
        this.originalQuantity
      );
    };

    // -----------------------------
    // EXECUTE SAVE FLOW
    // -----------------------------
    runOverrideSave()
      .pipe(concatMap(() => runInventorySave()))
      .subscribe({
        next: () => {
          console.log('Edit save success');
          this.finishSave();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Edit save failed:', err);
        }
      });
  }

  // -----------------------------
  // COMPLETE SAVE
  // -----------------------------
  finishSave(): void {
    //Added a timeout to ensure the backend has processed the changes before we reload the inventory list. 
    // This helps prevent the common issue where the list reloads before the changes are saved,
    //  causing the user to not see their updates reflected immediately.
    setTimeout(() => {
    this.passwordInput = '';

    this.showPasswordModal = false;
    this.showInventoryModal = false;

    this.selectedItem = null;

    //this.inventoryService.clearCache();

    this.loadInventory();
    }, 0);

    this.cdr.detectChanges();
  }

  // -----------------------------
  // UI COLORS
  // -----------------------------
  getReorderClass(item: InventoryRow): string {

    if (item.quantity < item.reorderPoint) return 'health-critical';
    if (item.quantity === item.reorderPoint) return 'health-warning';

    return '';

  }

  getExpirationClass(item: InventoryRow): string {

    const today = new Date();
    const expirationDate = new Date(item.expiration);

    const diffInDays =
      (expirationDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24);

    if (diffInDays < 0) return 'health-critical';
    if (diffInDays <= 30) return 'health-warning';

    return '';

  }

  logout() {
    localStorage.clear(); // or remove specific token
    sessionStorage.clear();
    window.location.href = '/login'; // or your login route
  }

}