import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';

// Importing the InventoryItem interface which defines the structure of inventory items used in the component.
import { InventoryService } from '../services/inventory.service';
import { InventoryRow } from './inventory.model';
import { mapInventoryApiToRow } from './inventory.mapper';

// Removed the export interface to the model file since we are now using InventoryRow as the main interface 
// for inventory items, which includes all necessary fields and is mapped from the API data.

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

export class InventoryComponent implements AfterViewInit {

  displayedColumns: string[] = [
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

  dataSource: InventoryRow[] = [];


// The constructor injects the InventoryService for fetching inventory data and the ChangeDetectorRef for manually triggering change detection after data is loaded.
  constructor(private inventoryService: InventoryService,
              private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    console.log('Loading inventory...');
    this.loadInventory();
  }

  loadInventory(): void {
    this.inventoryService.getInventoryStocks().subscribe({
      next: (data) => {
        this.dataSource = data.map(mapInventoryApiToRow)
        console.log('row:', this.dataSource.length, this.dataSource[0]);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('GET /InventoryStocks failed', err)
    });
  }

  getReorderClass(item: InventoryRow): string {
    if (item.quantity < item.reorderPoint) return 'health-critical';
    if (item.quantity === item.reorderPoint) return 'health-warning';
    return '';
  }

  getExpirationClass(item: InventoryRow): string {
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
  

  // might need to implement this in the API first before we can use it, since it requires leadTime and daysInv fields which we currently don't have in the API response
  // getDaysInvClass(item: InventoryRow): string {

  //   const diff = item.daysInv - item.leadTime;

  //   if (diff < 0) return 'health-critical';
  //   if (diff <= 2) return 'health-warning';
  //   return '';
  // }
}


