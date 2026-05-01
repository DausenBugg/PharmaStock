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

// Service + model + mapper
import { InventoryService } from '../services/inventory.service';
import { InventoryRow } from '../inventory/inventory.model';
import { mapInventoryApiToRow } from '../inventory/inventory.mapper';
import { InventoryApiItem } from '../models/inventory-api.model';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReportExportDialogComponent } from './reports-export-form';
import { MainLayoutComponent } from '../layout/main-layout/main-layout';
import { logoutUser } from "../helpers/auth.helpers";
import { getExpirationClass, getReorderClass} from '../helpers/inventory.helpers';



type Medication = InventoryRow;

interface ReportSummary {
  visible: number;
  expired: number;
  expiringSoon: number;
  stockedOut: number;
  lowInventory: number;
}

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
  readonly expiringSoonWindowDays = 30;

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
  private allItems: Medication[] = [];
  loading = true;
  loadError = false;
  summary: ReportSummary = {
    visible: 0,
    expired: 0,
    expiringSoon: 0,
    stockedOut: 0,
    lowInventory: 0
  };

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
    this.loading = true;
    this.loadError = false;

    this.inventoryService.getAllInventoryStocks().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (items) => {
        this.allItems = items.map(mapInventoryApiToRow);
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load inventory:', err);
        this.loadError = true;
        this.allItems = [];
        this.dataSource.data = [];
        this.summary = this.createSummary([]);
        this.cdr.detectChanges();
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
        (item.genericName ?? '').toLowerCase().includes(search) ||
        (item.nationalDrugCode ?? '').toLowerCase().includes(search) ||
        (item.lot ?? '').toLowerCase().includes(search) ||
        (item.packageNdc ?? '').toLowerCase().includes(search) ||
        (item.binLocation ?? '').toLowerCase().includes(search)
      );
    }

    // CHECKBOX FILTERS
    filtered = filtered.filter(item => {
      let isExpired = false;
      let isExpiringSoon = false;

      if (item.expiration) {
        const expirationDate = new Date(item.expiration);
        expirationDate.setHours(0,0,0,0);

        const diffDays =
          (expirationDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24);

        isExpired = diffDays < 0;
        isExpiringSoon = diffDays >= 0 && diffDays <= this.expiringSoonWindowDays;
      }

      const isStockedOut = item.quantity === 0;
      const isLowInventory = item.quantity < item.reorderPoint;

      if (this.filterExpired && !isExpired) return false;
      if (this.filterExpiringSoon && !isExpiringSoon) return false;
      if (this.filterStockedOut && !isStockedOut) return false;
      if (this.filterLowInventory && !isLowInventory) return false;

      return true;
    });

    this.dataSource.data = filtered;
    this.summary = this.createSummary(filtered);
    this.dataSource.paginator = this.paginator;

    // reattach paginator after data change
    if (this.paginator) {
      this.paginator.firstPage();
      this.dataSource.paginator = this.paginator;
    }
  }

  clearFilters(): void {

    this.searchValue = '';

    this.filterExpired = false;
    this.filterExpiringSoon = false;
    this.filterStockedOut = false;
    this.filterLowInventory = false;

    this.applyFilters();
  }

  get totalInventoryCount(): number {
    return this.allItems.length;
  }

  get activeFilterLabels(): string[] {
    const labels: string[] = [];

    if (this.filterExpired) labels.push('Expired');
    if (this.filterExpiringSoon) labels.push(`About to Expire (${this.expiringSoonWindowDays} days)`);
    if (this.filterStockedOut) labels.push('Stocked Out');
    if (this.filterLowInventory) labels.push('Low Inventory');

    return labels;
  }

  private createSummary(items: Medication[]): ReportSummary {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items.reduce<ReportSummary>((summary, item) => {
      summary.visible += 1;

      if (item.quantity === 0) {
        summary.stockedOut += 1;
      }

      if (item.quantity < item.reorderPoint) {
        summary.lowInventory += 1;
      }

      if (item.expiration) {
        const expirationDate = new Date(item.expiration);
        expirationDate.setHours(0, 0, 0, 0);

        const diffDays =
          (expirationDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24);

        if (diffDays < 0) {
          summary.expired += 1;
        } else if (diffDays <= this.expiringSoonWindowDays) {
          summary.expiringSoon += 1;
        }
      }

      return summary;
    }, {
      visible: 0,
      expired: 0,
      expiringSoon: 0,
      stockedOut: 0,
      lowInventory: 0
    });
  }

  getExpirationClass(item: InventoryRow){
    return getExpirationClass(item.expiration);
  }

  getReorderClass(item: InventoryRow){
    return getReorderClass(item.quantity, item.reorderPoint);
  }

  // OPEN EXPORT DIALOG
  // Opens a dialog where user can select report parameters and export to CSV
  openExportDialog(): void {
    this.dialog.open(ReportExportDialogComponent, {
      width: '500px',
      data: {
        rows: this.dataSource.data
      }
    });
  }

  logout() {
    logoutUser();
  }
}