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
  selectedItem: any = null;
  adjustQuantity: number | null = null;  
  showConfirmModal: boolean = false;
  confirmLotInput: string = '';

  displayedColumns = [
    'select',
    'brand',
    'generic',
    'dosage',
    'lot',
    'quantity',
    'leadTime',
    'expiration',
    'reorderPoint',
    'daysInv'
];

  filteredInventory: any[] = [];

  inventoryData = [
    { brand: 'Lipitor', generic: 'Atorvastatin', dosage: "25mg", lot: 'A1023', quantity: 150, expiration: '2026-04-12', leadTime: 14, reorderPoint: 75, daysInv: 14 },
    { brand: 'Zoloft', generic: 'Sertraline', dosage: "25mg", lot: 'B8831', quantity: 75, expiration: '2025-11-02', leadTime: 10, reorderPoint: 100, daysInv: 7 },
    { brand: 'Amoxil', generic: 'Amoxicillin', dosage: "25mg", lot: 'C4490', quantity: 220, expiration: '2026-01-18', leadTime: 7, reorderPoint: 75, daysInv: 20 },
    { brand: 'Glucophage', generic: 'Metformin', dosage: "25mg", lot: 'D7722', quantity: 300, expiration: '2027-03-30', leadTime: 21, reorderPoint: 50, daysInv: 126 },
    { brand: 'Synthroid', generic: 'Levothyroxine', dosage: "25mg", lot: 'E9910', quantity: 180, expiration: '2026-03-18', leadTime: 12, reorderPoint: 180, daysInv: 12 },
    { brand: 'Ventolin', generic: 'Albuterol', dosage: "25mg", lot: 'F6611', quantity: 90, expiration: '2026-07-20', leadTime: 8, reorderPoint: 25, daysInv: 14 },
    { brand: 'Plavix', generic: 'Clopidogrel', dosage: "25mg", lot: 'G3344', quantity: 140, expiration: '2026-12-05', leadTime: 16, reorderPoint: 40, daysInv: 28 },
    { brand: 'Nexium', generic: 'Esomeprazole', dosage: "25mg", lot: 'H5509', quantity: 110, expiration: '2025-08-22', leadTime: 9, reorderPoint: 150, daysInv: 6 },
    { brand: 'Lantus', generic: 'Insulin Glargine', dosage: "25mg", lot: 'J7812', quantity: 60, expiration: '2026-05-14', leadTime: 5, reorderPoint: 60, daysInv: 5 },
    { brand: 'Advil', generic: 'Ibuprofen', dosage: "25mg", lot: 'K9021', quantity: 400, expiration: '2027-02-10', leadTime: 6, reorderPoint: 15, daysInv: 160 }
  ];


  searchInventory() {
    this.filteredInventory = this.inventoryData.filter(item =>
      (!this.searchName ||
        item.brand.toLowerCase().includes(this.searchName.toLowerCase()) ||
        item.generic.toLowerCase().includes(this.searchName.toLowerCase()))
      &&
      (!this.searchDosage ||
        item.dosage.toLowerCase().includes(this.searchDosage.toLowerCase()))
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
    
    getDaysInvClass(item: any): string {
  
      const diff = item.daysInv - item.leadTime;
  
      if (diff < 0) return 'health-critical';
      if (diff <= 2) return 'health-warning';
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
}


