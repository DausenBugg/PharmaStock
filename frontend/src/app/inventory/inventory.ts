import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HttpClient } from '@angular/common/http';
import { PredictionService, ExpirationRisk } from '../services/prediction.service';

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

  constructor(private readonly http: HttpClient, private readonly predictionService: PredictionService) {
  }

  ngOnInit(): void {
    this.fetchInventoryStocks();
  }

  searchName = '';
  searchLot = '';
  nearExpirationOnly = false;
  private readonly nearExpirationDays = 7;

  displayedColumns: string[] = [
    'medicationName',
    'form',
    'strength',
    'nationalDrugCode',
    'lotNumber',
    'expirationDate',
    'quantityOnHand',
    'reorderPoint',
    'aiRiskScore',
    'binLocation'
  ];

  allItems: InventoryItem[] = [];

  dataSource: InventoryItem[] = [...this.allItems];

  // AI risk scores keyed by inventoryStockId
  riskScores: Map<number, ExpirationRisk> = new Map();

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
        this.loadRiskScores();
      },
      error: () => {
        this.allItems = [];
        this.dataSource = [];
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

  onSearch(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    const nameQuery = this.searchName.trim().toLowerCase();
    const lotQuery = this.searchLot.trim().toLowerCase();

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const nearExpirationCutoff = new Date(now);
    nearExpirationCutoff.setDate(nearExpirationCutoff.getDate() + this.nearExpirationDays);

    this.dataSource = this.allItems.filter((item) => {
      const medicationName = item.medicationName.toLowerCase();
      const matchesName = !nameQuery || medicationName.includes(nameQuery);
      const matchesLot = !lotQuery || item.lotNumber.toLowerCase().includes(lotQuery);

      const expirationDate = new Date(item.expirationDate);
      expirationDate.setHours(0, 0, 0, 0);

      const matchesNearExpiration = !this.nearExpirationOnly
        || (expirationDate >= now && expirationDate <= nearExpirationCutoff);

      return matchesName && matchesLot && matchesNearExpiration;
    });
  }

  clearFilters(): void {
    this.searchName = '';
    this.searchLot = '';
    this.nearExpirationOnly = false;
    this.dataSource = [...this.allItems];
  }

  getReorderClass(item: InventoryItem): string {
    if (item.quantityOnHand < item.reorderPoint) return 'health-critical';
    if (item.quantityOnHand === item.reorderPoint) return 'health-warning';
    return '';
  }

  getExpirationClass(item: InventoryItem): string {
    const today = new Date();
    const expirationDate = new Date(item.expirationDate);

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
}


