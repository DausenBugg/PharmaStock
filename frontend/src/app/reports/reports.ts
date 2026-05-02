import { ChangeDetectorRef, Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';

import { InventoryService } from '../services/inventory.service';
import { InventoryRow } from '../inventory/inventory.model';
import { mapInventoryApiToRow } from '../inventory/inventory.mapper';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReportExportDialogComponent } from './reports-export-form';
import { MainLayoutComponent } from '../layout/main-layout/main-layout';
import { getExpirationClass, getReorderClass } from '../helpers/inventory.helpers';

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
    MatPaginatorModule,
    MatDialogModule,
    MainLayoutComponent
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit, AfterViewInit {

  constructor(
    private route: ActivatedRoute,
    private inventoryService: InventoryService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
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

  loading = true;
  loadError = false;
  totalItemCount = 0;

  searchValue = '';

  filterExpired = false;
  filterExpiringSoon = false;
  filterStockedOut = false;
  filterLowInventory = false;

  summary = {
    expired: 0,
    expiringSoon: 0,
    stockedOut: 0,
    lowInventory: 0
  }

  // -----------------------------
  // INIT
  // -----------------------------
  ngOnInit(): void {
    const filterParam = this.route.snapshot.queryParamMap.get('filter');

    if (filterParam === 'expired') this.filterExpired = true;
    if (filterParam === 'expiringSoon') this.filterExpiringSoon = true;
    if (filterParam === 'stockedOut') this.filterStockedOut = true;
    if (filterParam === 'lowInventory') this.filterLowInventory = true;
  }

  // -----------------------------
  // PAGINATOR
  // -----------------------------
  ngAfterViewInit(): void {
    this.loadInventory(1, 25);

    this.paginator.page.subscribe(() => {
      this.loadInventory(
        this.paginator.pageIndex + 1,
        this.paginator.pageSize
      );
    });
  }

  // -----------------------------
  // LOAD DATA (SERVER-DRIVEN)
  // -----------------------------
  loadInventory(pageNumber = 1, pageSize = 25): void {
    this.loading = true;
    this.loadError = false;

    this.inventoryService.getInventoryStocks({
      pageNumber,
      pageSize,
      search: this.searchValue || "",
      expired: this.filterExpired === true,
      expiringSoon: this.filterExpiringSoon === true,
      stockedOut: this.filterStockedOut === true,
      lowInventory: this.filterLowInventory  === true
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.dataSource.data = res.items.map(mapInventoryApiToRow);
        this.totalItemCount = res.totalItemCount;
        this.summary = res.summary;
        this.paginator.length = res.totalItemCount;
      },
      error: (err) => {
        console.error('Failed to load inventory:', err);
        this.loadError = true;
        this.dataSource.data = [];
        this.totalItemCount = 0;
      }
    });
  }

  // -----------------------------
  // SEARCH
  // -----------------------------
  onSearch(): void {
    this.paginator.firstPage();
    this.loadInventory(1, this.paginator.pageSize);
  }

  // -----------------------------
  // FILTER CHANGE (CHECKBOXES)
  // -----------------------------
  onFilterChange(): void {
    this.paginator.firstPage();
    this.loadInventory(1, this.paginator.pageSize);
  }

  // -----------------------------
  // CLEAR FILTERS
  // -----------------------------
  clearFilters(): void {
    this.searchValue = '';
    this.filterExpired = false;
    this.filterExpiringSoon = false;
    this.filterStockedOut = false;
    this.filterLowInventory = false;

    this.paginator.firstPage();
    this.loadInventory(1, this.paginator.pageSize);
  }

  // -----------------------------
  // DISPLAY HELPERS
  // -----------------------------
  getExpirationClass(item: InventoryRow) {
    return getExpirationClass(item.expiration);
  }

  getReorderClass(item: InventoryRow) {
    return getReorderClass(item.quantity, item.reorderPoint);
  }

  openExportDialog(): void {
    const dialogRef = this.dialog.open(ReportExportDialogComponent, {
      width: '500px',
      data: {
        search: this.searchValue || undefined,
        expired: this.filterExpired ? true : undefined,
        expiringSoon: this.filterExpiringSoon ? true : undefined,
        stockedOut: this.filterStockedOut ? true : undefined,
        lowInventory: this.filterLowInventory ? true : undefined
      }
    });
  }

  get activeFilterLabels(): string[] {
    const labels: string[] = [];

    if (this.filterExpired) labels.push('Expired');
    if (this.filterExpiringSoon) labels.push('Expiring Soon');
    if (this.filterStockedOut) labels.push('Stocked Out');
    if (this.filterLowInventory) labels.push('Low Inventory');

    return labels;
  }
}