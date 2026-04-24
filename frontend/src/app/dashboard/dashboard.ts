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
import { InventoryApiItem } from '../models/inventory-api.model';
import { mapInventoryApiToRow } from '../inventory/inventory.mapper';
import { InventoryRow } from '../inventory/inventory.model';
import { NotificationSettingService } from '../services/notification-setting.service';
import { NotificationSetting } from '../models/notification-setting.model';
import { ProfileService } from '../services/profile.service';
import { Profile } from "../models/profile.model";
import { MainLayoutComponent } from '../layout/main-layout/main-layout';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    RouterModule,
    CommonModule,
    MainLayoutComponent
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  profile: Profile | null = null;
  profileImageUrl: string | null = null;

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

  // Alert thresholds (defaults until loaded from API)
  expirationWarningDays = 30;
  riskScoreCriticalThreshold = 0.75;
  riskScoreWarningThreshold = 0.50;
  minRiskScoreFilter = 0.25;

  constructor(
    private router: Router,
    private predictionService: PredictionService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private inventoryService: InventoryService,
    private notificationSettingService: NotificationSettingService,
    private profileService: ProfileService
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

      return diff >= 0 && diff <= this.expirationWarningDays;
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
      const expiringSoon = diff >= 0 && diff <= this.expirationWarningDays;
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


  private applySavedTheme(): void {
    const savedTheme = localStorage.getItem('theme');

    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    document.body.classList.toggle('light-theme', savedTheme !== 'dark');

    this.updateThemeState();
  }

  
  ngOnInit(): void {

    this.applySavedTheme();
    this.notificationSettingService.get().pipe(
      catchError(() => of(null))
    ).subscribe((settings) => {
      if (settings) {
        this.expirationWarningDays = settings.expirationWarningDays;
        this.riskScoreCriticalThreshold = settings.riskScoreCriticalThreshold;
        this.riskScoreWarningThreshold = settings.riskScoreWarningThreshold;
        this.minRiskScoreFilter = settings.minRiskScoreFilter;
      }
      this.refreshDashboard();
    });

    this.updateThemeState();

    this.loadUserProfile();
    this.loadUserImage();

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

    this.inventoryService.getInventoryStocks({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (response) => {
        this.inventoryItems = response.items.map(mapInventoryApiToRow);
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
      this.expirationRisks = safeRisks.filter(r => r.riskScore > this.minRiskScoreFilter).slice(0, 5);
    });
  }

  getRiskClass(score: number): string {
    if (score >= this.riskScoreCriticalThreshold) return 'health-critical';
    if (score >= this.riskScoreWarningThreshold) return 'health-warning';
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

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('pharmastock_jwt');
    sessionStorage.clear();

    window.location.href = '/login';
  }

  loadUserProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
      },
      error: () => {
        console.warn('Using fallback user');

        // TEMP fallback (until backend fully wired)
        this.profile = {
          id: '1',
          email: 'john@example.com',
          userName: 'John Doe',
          displayName: 'John Doe',
          roles: ['Administrator']
        };
      }
    });
  }

  loadUserImage(): void {
    this.profileService.getProfileImage().subscribe({
      next: (blob) => {
        this.profileImageUrl = URL.createObjectURL(blob);
      },
      error: () => {
        this.profileImageUrl = null; // fallback to placeholder
      }
    });
  }


}
