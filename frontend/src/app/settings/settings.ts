import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NotificationSettingService } from '../services/notification-setting.service';
import { NotificationSetting } from '../services/notification-setting.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {

  // ================= PROFILE =================
  displayName: string = 'John Doe';
  email: string = 'john@example.com';
  role: string = 'Administrator';
  profileImage: string | null = null;

  // ================= PASSWORD =================
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // ================= APPEARANCE =================
  darkMode: boolean = false;
  compactDensity: boolean = false;

  // ================= ALERT THRESHOLDS =================
  isAdmin: boolean = false;
  thresholdsLoading: boolean = false;
  thresholdsSaveMessage: string = '';
  thresholdsSaveError: boolean = false;
  expirationWarningDays: number = 30;
  lowStockThresholdPercent: number = 20;
  riskScoreCriticalThreshold: number = 0.75;
  riskScoreWarningThreshold: number = 0.50;
  minRiskScoreFilter: number = 0.25;

  constructor(
    private cdr: ChangeDetectorRef,
    private notificationSettingService: NotificationSettingService
  ) {
  const body = document.body;

  this.darkMode = body.classList.contains('dark-theme');
  this.compactDensity = body.classList.contains('compact-density');

  this.checkAdminRole();
}

  ngOnInit(): void {
    if (this.isAdmin) {
      this.loadThresholds();
    }
  }

  private checkAdminRole(): void {
    const token = localStorage.getItem('pharmastock_jwt');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      this.isAdmin = Array.isArray(roles) ? roles.includes('Admin') : roles === 'Admin';
    } catch {
      this.isAdmin = false;
    }
  }

  loadThresholds(): void {
    this.thresholdsLoading = true;
    this.notificationSettingService.get().subscribe({
      next: (settings) => {
        this.expirationWarningDays = settings.expirationWarningDays;
        this.lowStockThresholdPercent = settings.lowStockThresholdPercent;
        this.riskScoreCriticalThreshold = settings.riskScoreCriticalThreshold;
        this.riskScoreWarningThreshold = settings.riskScoreWarningThreshold;
        this.minRiskScoreFilter = settings.minRiskScoreFilter;
        this.thresholdsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.thresholdsLoading = false;
      }
    });
  }

  saveThresholds(): void {
    this.thresholdsSaveMessage = '';
    this.thresholdsSaveError = false;
    this.notificationSettingService.update({
      expirationWarningDays: this.expirationWarningDays,
      lowStockThresholdPercent: this.lowStockThresholdPercent,
      riskScoreCriticalThreshold: this.riskScoreCriticalThreshold,
      riskScoreWarningThreshold: this.riskScoreWarningThreshold,
      minRiskScoreFilter: this.minRiskScoreFilter
    }).subscribe({
      next: () => {
        this.thresholdsSaveMessage = 'Thresholds saved successfully.';
        this.thresholdsSaveError = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.thresholdsSaveMessage = 'Failed to save thresholds.';
        this.thresholdsSaveError = true;
        this.cdr.detectChanges();
      }
    });
  }

  // ================= IMAGE PREVIEW =================
  onImageUpload(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      this.profileImage = reader.result as string;

      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  // ================= PASSWORD UPDATE (UI ONLY) =================
  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      alert('Please fill in all fields.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }

    alert('Password updated (simulation).');

    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  // ================= DARK MODE =================
  toggleTheme() {
    const body = document.body;

    if (this.darkMode) {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
    }
  }

  // ================= TABLE DENSITY =================
  toggleDensity() {
    const body = document.body;

    if (this.compactDensity) {
      body.classList.add('compact-density');
    } else {
      body.classList.remove('compact-density');
    }
  }

  logout() {
    localStorage.clear(); // or remove specific token
    sessionStorage.clear();
    window.location.href = '/login'; // or your login route
  }
}