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
    MatPaginatorModule
  ],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements AfterViewInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  searchName: string = '';
  searchLot: string = '';

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

  
  dataSource = new MatTableDataSource<InventoryRow>([]);

  constructor(private inventoryService: InventoryService) {}

  ngAfterViewInit(): void {
    // initial load
    this.loadInventory(1, 25);
   
    this.paginator.page.subscribe(() => {
      this.loadInventory(
        this.paginator.pageIndex + 1,
        this.paginator.pageSize
      );
    });
  }

  loadInventory(pageNumber: number = 1, pageSize: number = 25): void {
    this.inventoryService.getInventoryStocks({
      pageNumber,
      pageSize,
      name: this.searchName || "",
      lot: this.searchLot || ""
    }).subscribe({
      next: (response) => {

        this.dataSource.data = response.items.map(mapInventoryApiToRow);
        this.paginator.length = response.totalItemCount;

      },
      error: (err) => {
        console.error('Orders load failed:', err);
      }
    });
  }

  searchInventory(): void {

    this.paginator.pageIndex = 0;

    this.loadInventory(
      1,
      this.paginator.pageSize
    );

  }

  clearSearch(): void {

    this.searchName = '';
    this.searchLot = '';

    this.paginator.pageIndex = 0;

    this.loadInventory(
      1,
      this.paginator.pageSize
    );

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

}