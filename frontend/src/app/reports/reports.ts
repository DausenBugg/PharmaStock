import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

export interface Medication {
  brand: string;
  generic: string;
  dosage: string;
  lot: string;
  quantity: number;
  expiration: string;
  leadTime: number;
  reorderPoint: number;
  daysInv: number;
}

const REPORT_DATA: Medication[] = [
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

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatButtonModule
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports {

  displayedColumns: string[] = [
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

  dataSource = new MatTableDataSource<Medication>([]);

  searchValue: string = '';

  onSearch(): void {

    const value = this.searchValue.trim().toLowerCase();

    if (!value) {
      this.dataSource.data = [];
      return;
    }

    const filteredData = REPORT_DATA.filter(med =>
      med.brand.toLowerCase().includes(value) ||
      med.generic.toLowerCase().includes(value)
    );

    this.dataSource.data = filteredData;
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

}