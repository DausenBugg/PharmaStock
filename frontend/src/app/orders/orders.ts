import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';

import { InventoryService } from "../services/inventory.service";
import { InventoryRow } from '../inventory/inventory.model';
import { mapInventoryApiToRow } from '../inventory/inventory.mapper';
import { MainLayoutComponent } from '../layout/main-layout/main-layout';
import { logoutUser } from "../helpers/auth.helpers";
import { getExpirationClass, getReorderClass} from '../helpers/inventory.helpers';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatPaginatorModule,
    MainLayoutComponent
  ],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements AfterViewInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  searchName: string = '';
  searchDosage: string = '';

  selectedItem: InventoryRow | null = null;
  adjustQuantity: number | null = null;
  showConfirmModal: boolean = false;
  confirmLotInput: string = '';

  displayedColumns: string[] = [
    'select',
    'medicationName',
    'genericName',
    'nationalDrugCode',
    'form',
    'strength',
    'packageNdc',
    'packageDescription',
    'quantity',
    'reorderPoint',
    'binLocation',
    'lot',
    'expiration',
    'beyondUseDate'
  ];

  private allItems: InventoryRow[] = [];

  // ✅ NEW
  dataSource = new MatTableDataSource<InventoryRow>([]);

  constructor(private inventoryService: InventoryService) {}

  ngAfterViewInit(): void {
    this.loadInventory();

    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  private loadInventory(): void {
    this.inventoryService.getInventoryStocks({
      pageNumber: 1,
      pageSize: 100
    }).subscribe({
      next: (response) => {
        this.allItems = response.items.map(mapInventoryApiToRow);
        this.dataSource.data = this.allItems;

        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      },
      error: (err) => {
        console.error('Orders load failed:', err);
      }
    });
  }

  searchInventory() {
    const filtered = this.allItems.filter(item =>
      (!this.searchName ||
        item.medicationName.toLowerCase().includes(this.searchName.toLowerCase()) ||
        (item.genericName ?? '').toLowerCase().includes(this.searchName.toLowerCase()))
      &&
      (!this.searchDosage ||
        item.strength.toLowerCase().includes(this.searchDosage.toLowerCase()))
    );

    this.dataSource.data = filtered;

    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  clearSearch() {
    this.searchName = '';
    this.searchDosage = '';

    this.dataSource.data = this.allItems;

    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  getExpirationClass(item: InventoryRow){
    return getExpirationClass(item.expiration);
  }

  getReorderClass(item: InventoryRow){
    return getReorderClass(item.quantity, item.reorderPoint);
  }

  onSelectRow(item: any, event: any) {
    if (event.target.checked) {
      this.selectedItem = item;
    } else {
      this.selectedItem = null;
      this.adjustQuantity = null;
    }
  }

  confirmAdjustment() {
    if (!this.selectedItem || !this.adjustQuantity || this.adjustQuantity <= 0) return;

    if (this.adjustQuantity > this.selectedItem.quantity) {
      alert('Cannot subtract more than available quantity.');
      return;
    }

    this.showConfirmModal = true;
  }

  finalizeAdjustment() {
    if (!this.selectedItem) return;

    if (this.confirmLotInput.trim().toLowerCase() !== this.selectedItem.lot.toLowerCase()) {
      alert('Lot number does not match. Adjustment cancelled.');
      return;
    }

    const adjustment = -this.adjustQuantity!;
    const targetId = this.selectedItem.inventoryStockId;

    this.inventoryService.adjustQuantity(targetId, adjustment).subscribe({
      next: () => {
        // update local display without a full reload
        const row = this.dataSource.data.find(r => r.inventoryStockId === targetId);
        if (row) row.quantity += adjustment;
        this.dataSource.data = [...this.dataSource.data];
        this.resetState();
      },
      error: (err) => {
        console.error('Adjustment failed:', err);
        alert('Failed to save adjustment. Please try again.');
        this.resetState();
      }
    });
  }

  cancelAdjustment() {
    this.showConfirmModal = false;
    this.confirmLotInput = '';
  }

  private resetState() {
    this.adjustQuantity = null;
    this.selectedItem = null;
    this.confirmLotInput = '';
    this.showConfirmModal = false;
  }

  logout() {
    logoutUser();
  }
}