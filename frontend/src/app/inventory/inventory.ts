import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HttpClient } from '@angular/common/http';

export interface InventoryItem {
  inventoryStockId: number;
  medicationId: number;
  medicationName: string;
  form: string;
  strength: string;
  nationalDrugCode: string;
  lotNumber: string;
  quantityOnHand: number;
  expirationDate: string;
  reorderPoint: number;
  binLocation: string;
  beyondUseDate: string;
}

interface ApiInventoryItem {
  inventoryStockId: number;
  medicationId: number;
  medicationName: string;
  form: string;
  strength: string;
  nationalDrugCode: string;
  quantityOnHand: number;
  reorderLevel: number;
  binLocation: string;
  lotNumber: string;
  expirationDate: string;
  beyondUseDate: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatTableModule
  ],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css']
})
export class InventoryComponent implements OnInit {
  private readonly apiUrl = 'http://localhost:5177/api/inventorystocks';

  constructor(private readonly http: HttpClient) {
  }

  ngOnInit(): void {
    this.fetchInventoryStocks();
  }

  searchName = '';
  searchLot = '';
  nearExpirationOnly = false;
  private readonly nearExpirationDays = 7;

  // --- TABLE ---
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
    'binLocation'
  ];

  allItems: InventoryItem[] = [];

  dataSource: InventoryItem[] = [...this.allItems];

  private fetchInventoryStocks(): void {
    this.http.get<ApiInventoryItem[]>(this.apiUrl).subscribe({
      next: (items) => {
        this.allItems = items.map((item) => ({
          inventoryStockId: item.inventoryStockId,
          medicationId: item.medicationId,
          medicationName: item.medicationName,
          form: item.form,
          strength: item.strength,
          nationalDrugCode: item.nationalDrugCode,
          lotNumber: item.lotNumber,
          quantityOnHand: item.quantityOnHand,
          reorderPoint: item.reorderLevel,
          binLocation: item.binLocation,
          expirationDate: item.expirationDate,
          beyondUseDate: item.beyondUseDate
        }));
        this.applyFilters();
      },
      error: () => {
        this.allItems = [];
        this.dataSource = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadRiskScores(): void {
    this.predictionService.getExpirationRisks().subscribe({
      next: (risks) => {
        this.riskScores = new Map(risks.map(r => [r.inventoryStockId, r]));
      },
      error: () => { /* AI unavailable — table still works */ }
    });
  }

  getRiskScore(item: InventoryItem): string {
    const risk = this.riskScores.get(item.inventoryStockId);
    if (!risk) return '—';
    return `${(risk.riskScore * 100).toFixed(0)}%`;
  }

  getRiskBadgeClass(item: InventoryItem): string {
    const risk = this.riskScores.get(item.inventoryStockId);
    if (!risk) return '';
    if (risk.riskScore >= 0.75) return 'health-critical';
    if (risk.riskScore >= 0.5) return 'health-warning';
    return '';
  }

  // Called by (ngSubmit)="onSearch()"
  onSearch(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchName = '';
    this.searchLot = '';
    this.nearExpirationOnly = false;
    this.dataSource = [...this.allItems];
  }

  // --- FILTER LOGIC ---
  private applyFilters(): void {
    const nameQuery = this.searchName.trim().toLowerCase();
    const lotQuery = this.searchLot.trim().toLowerCase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nearExpirationCutoff = new Date(today);
    nearExpirationCutoff.setDate(nearExpirationCutoff.getDate() + this.nearExpirationDays);

    this.dataSource = this.allItems.filter((row) => {
      const medName = (row.medicationName ?? '').toLowerCase();
      const lot = (row.lot ?? '').toLowerCase();

      const matchesName = !nameQuery || medName.includes(nameQuery);
      const matchesLot = !lotQuery || lot.includes(lotQuery);

      // Support either `expiration` or `expirationDate` depending on your model/mapper
      const expValue = (row as any).expiration ?? (row as any).expirationDate;
      const expDate = expValue ? new Date(expValue) : null;

      let matchesNearExpiration = true;
      if (this.nearExpirationOnly) {
        if (!expDate || isNaN(expDate.getTime())) {
          matchesNearExpiration = false;
        } else {
          expDate.setHours(0, 0, 0, 0);
          matchesNearExpiration = expDate >= today && expDate <= nearExpirationCutoff;
        }
      }

      return matchesName && matchesLot && matchesNearExpiration;
    });
  }

  // --- UI CLASSES ---
  getReorderClass(item: InventoryRow): string {
    if (item.quantity < item.reorderPoint) return 'health-critical';
    if (item.quantity === item.reorderPoint) return 'health-warning';
    return '';
  }

  getExpirationClass(item: InventoryRow): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expValue = (item as any).expiration ?? (item as any).expirationDate;
    if (!expValue) return '';

    const expirationDate = new Date(expValue);
    if (isNaN(expirationDate.getTime())) return '';

    expirationDate.setHours(0, 0, 0, 0);

    const diffInDays =
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays < 0) return 'health-critical';   // expired
    if (diffInDays <= 30) return 'health-warning';  // expiring soon
    return '';
  }
}