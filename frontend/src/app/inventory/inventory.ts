import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PredictionService, ExpirationRisk } from '../services/prediction.service';

// Service + model + mapper
import { InventoryService } from '../services/inventory.service';
import { InventoryRow } from './inventory.model';
import { mapInventoryApiToRow } from './inventory.mapper';

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
export class InventoryComponent implements AfterViewInit {

  // --- SEARCH/FILTER STATE ---
  searchName: string = '';
  searchLot: string = '';
  nearExpirationOnly: boolean = false;
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
    'aiRiskScore',
    'binLocation',
    'lot',
    'expiration',
    'beyondUseDate'
  ];

  // Keep a master list and a filtered list
  private allItems: InventoryRow[] = [];
  dataSource: InventoryRow[] = [];

  // AI risk scores keyed by inventoryStockId
  riskScores: Map<number, ExpirationRisk> = new Map();

  constructor(
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef,
    private predictionService: PredictionService
  ) {}

  ngAfterViewInit(): void {
    this.loadInventory();
  }

  // --- FETCH ---
  private loadInventory(): void {
    this.inventoryService.getInventoryStocks().subscribe({
      next: (data) => {
        this.allItems = data.map(mapInventoryApiToRow);
        this.applyFilters();
        this.loadRiskScores();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('GET /InventoryStocks failed', err);
        this.allItems = [];
        this.dataSource = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadRiskScores(): void {
    this.predictionService.getExpirationRisks().subscribe({
      next: (risks) => {
        this.riskScores = new Map(risks.map((r) => [r.inventoryStockId, r]));
      },
      error: () => {
        // AI service can be temporarily unavailable; inventory still renders.
      }
    });
  }

  getRiskScore(item: InventoryRow): string {
    const risk = this.riskScores.get(item.inventoryStockId);
    if (!risk) return '-';
    return `${(risk.riskScore * 100).toFixed(0)}%`;
  }

  getRiskBadgeClass(item: InventoryRow): string {
    const risk = this.riskScores.get(item.inventoryStockId);
    if (!risk) return '';
    if (risk.riskScore >= 0.75) return 'health-critical';
    if (risk.riskScore >= 0.5) return 'health-warning';
    return '';
  }

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