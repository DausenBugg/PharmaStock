import { ChangeDetectorRef, Component, NgZone, OnDestroy } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import { PredictionService, ReorderAlert, ExpirationRisk } from '../services/prediction.service';
import { catchError, finalize, interval, of, Subject, takeUntil, timeout } from 'rxjs';

import { InventoryService } from '../services/inventory.service';
import { InventoryApiItem } from '../services/inventory-api.model';
import { mapInventoryApiToRow } from '../inventory/inventory.mapper';
import { InventoryRow } from '../inventory/inventory.model';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  // Added private var for dashboard destroy for auto-refresh
  private destroyDashboard$ = new Subject<void>();

  // Adding a mutation observer to detect theme changes and update the dashboard accordingly
  private themeObserver?: MutationObserver;

  inventoryHealth = 70;   // Change this to test colors
  totalMeds = 551;
  expired = 0;
  expiringSoon = 1;
  stockedOut = 6;
  lowInventory = 10;

  // AI Predictions
  reorderAlerts: ReorderAlert[] = [];
  expirationRisks: ExpirationRisk[] = [];
  reorderLoading = true;
  expirationLoading = true;
  reorderError = false;
  expirationError = false;

  constructor(
    private router: Router,
    private predictionService: PredictionService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private inventoryService: InventoryService
  ){}

  calculateInventoryStats() {

    const today = new Date();
    today.setHours(0,0,0,0);

    const data = this.inventoryItems;

    this.totalMeds = data.length;

    this.expired = data.filter(item =>
      item.expiration && new Date(item.expiration) < today
    ).length;

    this.expiringSoon = data.filter(item => {
      if (!item.expiration) return false;

      const exp = new Date(item.expiration);
      const diff =
        (exp.getTime() - today.getTime()) / (1000*60*60*24);

      return diff >= 0 && diff <= 30;
    }).length;

    this.stockedOut = data.filter(item =>
      item.quantity === 0
    ).length;

    this.lowInventory = data.filter(item =>
      item.quantity < item.reorderPoint
    ).length;

    /* ===== INVENTORY HEALTH ===== */

    const problemLines = data.filter(item => {

      if (!item.expiration) return false;

      const expirationDate = new Date(item.expiration);
      const diff =
        (expirationDate.getTime() - today.getTime()) / (1000*60*60*24);

      const expired = expirationDate < today;
      const expiringSoon = diff >= 0 && diff <= 30;
      const lowInventory = item.quantity < item.reorderPoint;

      return expired || expiringSoon || lowInventory;

    }).length;

    this.inventoryHealth =
      this.totalMeds === 0 ? 0 :
      Math.round(((this.totalMeds - problemLines) / this.totalMeds) * 100);

  }

  get inventoryHealthClass(): string {
    if (this.inventoryHealth > 95) {
      return 'health-good';
    } else if (this.inventoryHealth >= 85) {
      return 'health-warning';
    } else {
      return 'health-critical';
    }
  }

  isDarkMode = false;
  private inventoryItems: InventoryRow[] = [];

  // -----------------------------
  // New ngOnInIt for refreshing inventory after edits/refreshing
  // -----------------------------

  ngOnInit(): void {
    this.refreshDashboard();

    this.updateThemeState();

    this.themeObserver = new MutationObserver(() => {
      this.updateThemeState();
    });

    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    interval(60000).pipe(takeUntil(this.destroyDashboard$)).subscribe(() => {
      this.refreshDashboard();
    });
  }

  ngOnDestroy(): void {
    this.destroyDashboard$.next();
    this.destroyDashboard$.complete();
    this.themeObserver?.disconnect();
  }

  refreshDashboard(): void {

    console.log('Refreshing dashboard data at:', new Date().toLocaleTimeString());

    this.inventoryService.getInventoryStocks().subscribe({
      next: (data: InventoryApiItem[]) => {

        this.inventoryItems = data.map(mapInventoryApiToRow);

        this.calculateInventoryStats();
        this.loadAIPredictions();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dashboard inventory load failed:', err);
      }
    });
  }

  manualRefresh(): void {
    this.refreshDashboard();
  }

  // -----------------------------
  // end of new ngOnInit for refreshing inventory after edits/refreshing
  // -----------------------------


  loadAIPredictions() {
    this.reorderLoading = true;
    this.expirationLoading = true;
    this.reorderError = false;
    this.expirationError = false;

    this.predictionService.getReorderAlerts().pipe(
      timeout(10000),
      catchError(() => {
        this.reorderError = true;
        return of([] as ReorderAlert[]);
      }),
      finalize(() => {
        this.reorderLoading = false;
        this.ngZone.run(() => this.cdr.detectChanges());
      })
    ).subscribe((alerts) => {
      this.reorderAlerts = Array.isArray(alerts) ? alerts : [];
    });

    this.predictionService.getExpirationRisks().pipe(
      timeout(10000),
      catchError(() => {
        this.expirationError = true;
        return of([] as ExpirationRisk[]);
      }),
      finalize(() => {
        this.expirationLoading = false;
        this.ngZone.run(() => this.cdr.detectChanges());
      })
    ).subscribe((risks) => {
      const safeRisks = Array.isArray(risks) ? risks : [];
      this.expirationRisks = safeRisks.filter(r => r.riskScore > 0.25).slice(0, 5);
    });
  }

  getRiskClass(score: number): string {
    if (score >= 0.75) return 'health-critical';
    if (score >= 0.5) return 'health-warning';
    return '';
  }

  updateThemeState() {
    this.isDarkMode = document.body.classList.contains('dark-theme');
  }

  goToInventory():void{
    this.router.navigate(['/inventory']);
  }

  goToOrders():void{
    this.router.navigate(['/orders']);
  }

  goToReports(filter?: string): void {
    this.router.navigate(['/reports'], {
      queryParams: filter ? { filter } : {}
    });
  }

  goToSettings():void{
    this.router.navigate(['settings']);
  }

  goToAdministration():void{
    this.router.navigate(['administration']);
  }

  logout() {
    localStorage.clear(); // or remove specific token
    sessionStorage.clear();
    window.location.href = '/login'; // or your login route
  }


}
