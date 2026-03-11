import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import { REPORT_DATA, Medication } from '../reports/reports';
import { PredictionService, ReorderAlert, ExpirationRisk } from '../services/prediction.service';
import { catchError, finalize, of, timeout } from 'rxjs';


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
export class DashboardComponent implements OnInit {

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
    private ngZone: NgZone
  ){}

  calculateInventoryStats() {

  const today = new Date();
  today.setHours(0,0,0,0);

  this.totalMeds = REPORT_DATA.length;

  this.expired = REPORT_DATA.filter((med: Medication) =>
    new Date(med.expiration) < today
  ).length;

  this.expiringSoon = REPORT_DATA.filter((med: Medication) => {

    const exp = new Date(med.expiration);
    const diff =
      (exp.getTime() - today.getTime()) / (1000*60*60*24);

    return diff >= 0 && diff <= 30;

  }).length;

  this.stockedOut = REPORT_DATA.filter((med: Medication) =>
    med.quantity === 0
  ).length;

  this.lowInventory = REPORT_DATA.filter((med: Medication) =>
    med.quantity < med.reorderPoint
  ).length;


  /* ===== INVENTORY HEALTH CALCULATION ===== */

  const problemLines = REPORT_DATA.filter((med: Medication) => {

    const expirationDate = new Date(med.expiration);
    const diff =
      (expirationDate.getTime() - today.getTime()) / (1000*60*60*24);

    const expired = expirationDate < today;
    const expiringSoon = diff >= 0 && diff <= 30;

    const lowInventory = med.quantity < med.reorderPoint;

    const daysInvIssue = med.daysInv < med.leadTime;

    return expired || expiringSoon || lowInventory || daysInvIssue;

  }).length;

  this.inventoryHealth =
    Math.round(
      ((this.totalMeds - problemLines) / this.totalMeds) * 100
    );

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

  ngOnInit() {

    this.calculateInventoryStats();   // ← ADD THIS

    this.updateThemeState();

    const observer = new MutationObserver(() => {
      this.updateThemeState();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    this.loadAIPredictions();
  }

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


}
