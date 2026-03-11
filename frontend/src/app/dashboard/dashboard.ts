import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
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

  goToReports():void{
    this.router.navigate(['reports']);
  }

  goToSettings():void{
    this.router.navigate(['settings']);
  }

  goToAdministration():void{
    this.router.navigate(['administration']);
  }


}
