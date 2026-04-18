import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NotificationSettingService } from '../services/notification-setting.service';

import { ProfileService } from '../services/profile.service';
import { Profile } from '../models/profile.model';
import { MainLayoutComponent } from '../layout/main-layout/main-layout';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MainLayoutComponent
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {

  // ================= PROFILE =================
  profile: Profile = {
    id: '1',
    email: 'john@example.com',
    userName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '123-456-7890',
    roles: ['Admin']
  };

  profileImageUrl: string | null = null;
  selectedFile: File | null = null;

  // Keep these for compatibility with existing template bindings.
  displayName: string = this.profile.userName;
  email: string = this.profile.email;
  role: string = this.profile.roles?.[0] ?? 'User';
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
    private notificationSettingService: NotificationSettingService,
    private profileService: ProfileService
  ) {
    const body = document.body;

    this.darkMode = body.classList.contains('dark-theme');
    this.compactDensity = body.classList.contains('compact-density');

    this.checkAdminRole();
  }

  // ================= UI STATE =================
  errorMessage: string = '';
  successMessage: string = '';

  // ================= INIT =================
  ngOnInit(): void { // UNCOMMENT PROFILE BACKEND CALLS WHEN TIED IN

    if (this.isAdmin) {
      this.loadThresholds();
    }

    // BACKEND VERSION (enable later)
    /*
    this.loadProfile();
    this.loadProfileImage();
    */
  }

  // ================= LOAD PROFILE =================
  loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.displayName = data.userName;
        this.email = data.email;
        this.role = data.roles?.[0] ?? 'User';
      },
      error: () => {
        this.errorMessage = 'Failed to load profile.';
      }
    });
  }

  // ================= LOAD IMAGE =================
  loadProfileImage(): void {
    this.profileService.getProfileImage().subscribe({
      next: (blob) => {
        this.profileImageUrl = URL.createObjectURL(blob);
        this.profileImage = this.profileImageUrl;
      },
      error: () => {
        console.warn('No profile image found');
      }
    });
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
  onImageUpload(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.profileImageUrl = reader.result as string;
      this.profileImage = this.profileImageUrl;
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  // ================= IMAGE UPLOAD ================= 
  uploadImage(): void {
    if (!this.selectedFile) return;     //UNCOMMENT WHEN  BACKEND IS TIED IN

    /*
    this.profileService.updateProfileImage(this.selectedFile).subscribe({
      next: () => {
        this.successMessage = 'Image updated.';
        this.loadProfileImage();
      },
      error: () => {
        this.errorMessage = 'Image upload failed.';
      }
    });
    */

    // TEMP: simulate success
    this.successMessage = 'Image updated (simulation).';
  }

  // ================= SAVE PROFILE =================
  saveProfile(): void { // UNCOMMENT WHEN BACKEND IS TIED IN

    // Keep compatibility with existing template bindings.
    this.profile.userName = this.displayName;
    this.profile.email = this.email;

    /*
    this.profileService.updateProfile(this.profile).subscribe({
      next: () => {
        this.successMessage = 'Profile updated.';
      },
      error: () => {
        this.errorMessage = 'Failed to update profile.';
      }
    });
    */

    // TEMP: simulate success
    this.successMessage = 'Profile updated (simulation).';
  }

  // ================= PASSWORD =================
  changePassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }                                 //UNCOMMENT WHEN BACKEND IS TIED IN
        
    /*
    this.profileService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: () => {
        this.successMessage = 'Password updated.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: () => {
        this.errorMessage = 'Password update failed.';
      }
    });
    */

    // TEMP: simulate success
    this.successMessage = 'Password updated (simulation).';

    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  // ================= DARK MODE =================
  toggleTheme(): void {
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
  toggleDensity(): void {
    const body = document.body;

    if (this.compactDensity) {
      body.classList.add('compact-density');
    } else {
      body.classList.remove('compact-density');
    }
  }

  // ================= LOGOUT =================
  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  }
}