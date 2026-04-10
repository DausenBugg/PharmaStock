import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';

// Service + model + mapper
import { InventoryService } from '../services/inventory.service';
import { InventoryRow } from '../inventory/inventory.model';
import { mapInventoryApiToRow } from '../inventory/inventory.mapper';
import { InventoryApiItem } from '../services/inventory-api.model';

type Medication = InventoryRow;

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
    MatButtonModule,
    MatPaginatorModule
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit, AfterViewInit {

  constructor(
    private route: ActivatedRoute,
    private inventoryService: InventoryService
  ) {}

  @ViewChild(MatPaginator) paginator!: MatPaginator;

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

  dataSource = new MatTableDataSource<Medication>([]);
  private allItems: Medication[] = [];

  searchValue: string = '';

  filterExpired = false;
  filterExpiringSoon = false;
  filterStockedOut = false;
  filterLowInventory = false;

  ngOnInit(): void {

    const filterParam = this.route.snapshot.queryParamMap.get('filter');

    if (filterParam === 'expired') this.filterExpired = true;
    if (filterParam === 'expiringSoon') this.filterExpiringSoon = true;
    if (filterParam === 'stockedOut') this.filterStockedOut = true;
    if (filterParam === 'lowInventory') this.filterLowInventory = true;

    this.loadInventory();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadInventory(): void {

    this.inventoryService.getInventoryStocks({pageNumber: 1, pageSize: 100}).subscribe({
      next: (response) => {

        this.allItems = response.items.map(mapInventoryApiToRow);

        this.applyFilters();

      },
      error: (err) => {
        console.error('Failed to load inventory:', err);
      }
    });

  }

  onSearch(): void {
    this.applyFilters();
  }

  applyFilters(): void {

    const today = new Date();
    today.setHours(0,0,0,0);

    const search = this.searchValue.trim().toLowerCase();

    let filtered = this.allItems;

    // SEARCH
    if (search) {
      filtered = filtered.filter(item =>
        (item.medicationName ?? '').toLowerCase().includes(search) ||
        (item.genericName ?? '').toLowerCase().includes(search)
      );
    }

    // CHECKBOX FILTERS
    filtered = filtered.filter(item => {

      if (!item.expiration) return true;

      const expirationDate = new Date(item.expiration);
      expirationDate.setHours(0,0,0,0);

      const diffDays =
        (expirationDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24);

      const isExpired = diffDays < 0;
      const isExpiringSoon = diffDays >= 0 && diffDays <= 30;
      const isStockedOut = item.quantity === 0;
      const isLowInventory = item.quantity < item.reorderPoint;

      if (this.filterExpired && !isExpired) return false;
      if (this.filterExpiringSoon && !isExpiringSoon) return false;
      if (this.filterStockedOut && !isStockedOut) return false;
      if (this.filterLowInventory && !isLowInventory) return false;

      return true;
    });

    this.dataSource.data = filtered;
    this.dataSource.paginator = this.paginator;

    // reattach paginator after data change
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  clearFilters(): void {

    this.searchValue = '';

    this.filterExpired = false;
    this.filterExpiringSoon = false;
    this.filterStockedOut = false;
    this.filterLowInventory = false;

    this.dataSource.data = this.allItems;

    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  getReorderClass(item: Medication): string {

    if (item.quantity < item.reorderPoint) return 'health-critical';
    if (item.quantity === item.reorderPoint) return 'health-warning';

    return '';
  }

  getExpirationClass(item: Medication): string {

    if (!item.expiration) return '';

    const today = new Date();
    const expirationDate = new Date(item.expiration);

    today.setHours(0,0,0,0);

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