import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';

export interface InventoryItem {
  brand: string;
  generic: string;
  lot: string;
  quantity: number;
  expiration: string;
  leadTime: number;
  reorderPoint: number;
  daysInv: number;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatTableModule
  ],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css']
})
export class InventoryComponent {

  displayedColumns: string[] = [
    'brand',
    'generic',
    'lot',
    'expiration',  
    'quantity',
    'reorderPoint',
    'leadTime',   
    'daysInv'
  ];

  dataSource: InventoryItem[] = [
    { brand: 'Lipitor', generic: 'Atorvastatin', lot: 'A1023', quantity: 150, expiration: '2026-04-12', leadTime: 14, reorderPoint: 75, daysInv: 14 },
    { brand: 'Zoloft', generic: 'Sertraline', lot: 'B8831', quantity: 75, expiration: '2025-11-02', leadTime: 10, reorderPoint: 100, daysInv: 7 },
    { brand: 'Amoxil', generic: 'Amoxicillin', lot: 'C4490', quantity: 220, expiration: '2026-01-18', leadTime: 7, reorderPoint: 75, daysInv: 20 },
    { brand: 'Glucophage', generic: 'Metformin', lot: 'D7722', quantity: 300, expiration: '2027-03-30', leadTime: 21, reorderPoint: 50, daysInv: 126 },
    { brand: 'Synthroid', generic: 'Levothyroxine', lot: 'E9910', quantity: 180, expiration: '2026-03-18', leadTime: 12, reorderPoint: 180, daysInv: 12 },
    { brand: 'Ventolin', generic: 'Albuterol', lot: 'F6611', quantity: 90, expiration: '2026-07-20', leadTime: 8, reorderPoint: 25, daysInv: 14 },
    { brand: 'Plavix', generic: 'Clopidogrel', lot: 'G3344', quantity: 140, expiration: '2026-12-05', leadTime: 16, reorderPoint: 40, daysInv: 28 },
    { brand: 'Nexium', generic: 'Esomeprazole', lot: 'H5509', quantity: 110, expiration: '2025-08-22', leadTime: 9, reorderPoint: 150, daysInv: 6 },
    { brand: 'Lantus', generic: 'Insulin Glargine', lot: 'J7812', quantity: 60, expiration: '2026-05-14', leadTime: 5, reorderPoint: 60, daysInv: 5 },
    { brand: 'Advil', generic: 'Ibuprofen', lot: 'K9021', quantity: 400, expiration: '2027-02-10', leadTime: 6, reorderPoint: 15, daysInv: 160 }
  ];

  getReorderClass(item: InventoryItem): string {
    if (item.quantity < item.reorderPoint) return 'health-critical';
    if (item.quantity === item.reorderPoint) return 'health-warning';
    return '';
  }

  getExpirationClass(item: InventoryItem): string {
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
  
  getDaysInvClass(item: InventoryItem): string {

    const diff = item.daysInv - item.leadTime;

    if (diff < 0) return 'health-critical';
    if (diff <= 2) return 'health-warning';
    return '';
  }
}


