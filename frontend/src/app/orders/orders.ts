import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { InventoryService } from "../services/inventory.service";
import { InventoryRow } from '../inventory/inventory.model';
import { mapInventoryApiToRow } from '../inventory/inventory.mapper';

@Component({
  selector: 'app-orders',
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
    MatButtonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
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
    'aiRiskScore',
    'binLocation',
    'lot',
    'expiration',
    'beyondUseDate'
  ];

  private allItems: InventoryRow[] = [];
  filteredInventory: InventoryRow[] = [];

  constructor(private inventoryService: InventoryService){}

  ngAfterViewInit():void {
    this.loadInventory();
  }

  private loadInventory(): void{
    this.inventoryService.getInventoryStocks().subscribe({
      next: (data) => {
        this.allItems = data.map(mapInventoryApiToRow);
        this.filteredInventory = [...this.allItems];
      },
      error: (err) => {
        console.error('Orders load failed:', err);
      }
    });
  }


  searchInventory() {
    this.filteredInventory = this.allItems.filter(item =>
      (!this.searchName ||
        item.medicationName.toLowerCase().includes(this.searchName.toLowerCase()) ||
        (item.genericName ?? '').toLowerCase().includes(this.searchName.toLowerCase()))
      &&
      (!this.searchDosage ||
        item.strength.toLowerCase().includes(this.searchDosage.toLowerCase()))
    );
  }

  getReorderClass(item: any): string {
      if (item.quantity < item.reorderPoint) return 'health-critical';
      if (item.quantity === item.reorderPoint) return 'health-warning';
      return '';
  }
  
  getExpirationClass(item: any): string {
    const today = new Date();
    const expirationDate = new Date(item.expiration);

    today.setHours(0, 0, 0, 0);

    const diffInDays =
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays < 0) {
      return 'health-critical';   // expired
    }

    if (diffInDays <= 30) {
      return 'health-warning';    // expiring soon
    }

    return '';
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
    if (!this.selectedItem || !this.adjustQuantity || this.adjustQuantity <= 0) {
      return;
    }
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
      this.selectedItem.quantity -= this.adjustQuantity!;
      // Reset everything
      this.adjustQuantity = null;
      this.selectedItem = null;
      this.confirmLotInput = '';
      this.showConfirmModal = false;
      // Refresh table
      this.filteredInventory = [...this.filteredInventory];
    }
  cancelAdjustment() {
    this.showConfirmModal = false;
    this.confirmLotInput = '';
  }

  private resetState(){
    this.adjustQuantity = null;
    this.selectedItem = null;
    this.confirmLotInput = '';
    this.showConfirmModal = false;
  }

  clearSearch() {
    this.searchName = '';
    this.searchDosage = '';

    // Reset table to full list
    this.filteredInventory = [...this.allItems];
  }
}