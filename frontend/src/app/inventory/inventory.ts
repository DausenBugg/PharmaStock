import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';

import { PredictionService, ExpirationRisk } from '../services/prediction.service';

// Service + model + mapper
import { InventoryService } from '../services/inventory.service';
import { InventoryRow } from './inventory.model';
import { mapInventoryApiToRow } from './inventory.mapper';
import { InventoryApiItem } from '../services/inventory-api.model';

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
    MatTableModule
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
  dataSource: InventoryRow[] = [];

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
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.loadInventory();
  }

  // -----------------------------
  // LOAD INVENTORY
  // -----------------------------
  loadInventory(): void {

    this.inventoryService.getInventoryStocks().subscribe({
      next: (data) => {

        this.allItems = data.map(mapInventoryApiToRow);
        this.dataSource = [...this.allItems];

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

    this.dataSource = this.allItems.filter(item =>
      (!nameQuery || item.medicationName.toLowerCase().includes(nameQuery) ||
        (item.genericName ?? '').toLowerCase().includes(nameQuery)) &&
      (!lotQuery || item.lot.toLowerCase().includes(lotQuery))
    );

  }

  clearFilters(): void {

    this.searchName = '';
    this.searchLot = '';

    this.dataSource = [...this.allItems];

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
    this.showInventoryModal = true;

    if (this.selectedItem) {

        this.editingItem = this.selectedItem;

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

    const newQuantity = Number(this.formItem.quantityOnHand);
    const oldQuantity = Number(this.originalQuantity);
    const adjustment = newQuantity - oldQuantity;

    console.log('Old quantity:', oldQuantity);
    console.log('New quantity:', newQuantity);
    console.log('Adjustment:', adjustment);

    if (adjustment !== 0) {
      this.inventoryService
        .adjustQuantity(this.editingItem.inventoryStockId, adjustment)
        .subscribe({
          next: (res) => {
            console.log('Adjust success:', res);
            this.finishSave();
          },
          error: (err) => {
            console.error('Adjust failed:', err);
          }
        });
    } else {
      console.log('No quantity change detected.');
      this.finishSave();
    }
  }

  // -----------------------------
  // COMPLETE SAVE
  // -----------------------------
  finishSave(): void {

    this.passwordInput = '';

    this.showPasswordModal = false;
    this.showInventoryModal = false;

    this.selectedItem = null;

    //this.inventoryService.clearCache();

    this.loadInventory();

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

}