import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { environment } from '../../environments/environment';
import { versionInfo } from '../../environments/version';


import { NotificationSettingService } from '../services/notification-setting.service';

import { ProfileService } from '../services/profile.service';
import { Profile } from '../models/profile.model';
import { MainLayoutComponent } from '../layout/main-layout/main-layout';
import { logoutUser } from "../helpers/auth.helpers";
import { createProfileImage, revokeProfileImage } from '../helpers/profile.helpers';
import { applySavedTheme, toggleTheme, applySavedDensity, toggleDensity} from '../helpers/theme.helpers';
import { isEmpty, validatePasswordMatch } from '../helpers/validation.helpers';

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

  // =================== Refresh ==================
    refreshPage(): void {
      this.loadProfile();
      this.loadProfileImage();

      // admin-only thresholds
      if (this.isAdmin) {
        this.loadThresholds();
      }
    }

  //================== ENVIRONMENT INFO =================
  environment = environment;
  versionInfo = versionInfo;

  // ================= PROFILE =================
  profile: Profile = {
    id: '1',
    email: 'john@example.com',
    userName: 'John Doe',
    roles: ['Admin'],
    displayName: 'John Doe',
    bio: ''
  };

  profileImageUrl: string | null = null;
  selectedFile: File | null = null;

  editDisplayName: string = '';
  editBio: string = '';


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
    this.checkAdminRole();
  }

  // ================= UI STATE =================
  errorMessage: string = '';
  successMessage: string = '';

  // ================= INIT =================
  ngOnInit(): void { // UNCOMMENT PROFILE BACKEND CALLS WHEN TIED IN
    // Apply saved theme
    this.darkMode = applySavedTheme();
    this.compactDensity = applySavedDensity();

    // Load profile and image
    this.refreshPage();

    if (this.isAdmin) {
      this.loadThresholds();
    }
  }

  // ================= LOAD PROFILE =================
  loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.displayName = data.displayName;
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
      revokeProfileImage(this.profileImageUrl);

      this.profileImageUrl = createProfileImage(blob);
      this.profileImage = this.profileImageUrl;
      this.cdr.detectChanges();
    },
    error: () => {
      this.profileImageUrl = null;
      this.profileImage = null;
      this.cdr.detectChanges();
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


    // size validation 2MB
    const maxSize = 2 * 1024 * 1024;

    if(file.size > maxSize){
      this.errorMessage = 'Image must be 2MB or less. ;)';
      alert(this.errorMessage);
    

      this.selectedFile = null;
      event.target.value = ''; 
      return;
    }
    
    // type validation
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      alert(this.errorMessage);

      this.selectedFile = null;
      event.target.value = '';
      return;
    }

    // for vaild file type
    this.selectedFile = file;
    this.refreshPage();

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
  this.errorMessage = '';
  this.successMessage = '';

  if (!this.selectedFile) {
    this.errorMessage = 'Please choose an image first.';
    return;
  }

  this.profileService.updateProfileImage(this.selectedFile).subscribe({
    next: () => {
      this.successMessage = 'Profile image updated successfully.';
      this.refreshPage();
      this.selectedFile = null;

      // refresh backend profile image
     
      this.cdr.detectChanges();

      alert(this.successMessage);
    },
    error: () => {
      this.errorMessage = 'Image upload failed.';
      alert(this.errorMessage);
    }
  });
}

  // ================= SAVE PROFILE =================
  saveProfile(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // First update profile fields
    this.profileService.updateProfile(this.profile).subscribe({
      next: () => {

        // If image selected → upload it too
        if (this.selectedFile) {
          this.profileService.updateProfileImage(this.selectedFile).subscribe({
            next: () => {
              this.successMessage = 'Profile and image updated successfully.';
              this.selectedFile = null;
              this.loadProfile();
              this.loadProfileImage();

              
              this.cdr.detectChanges();

              alert(this.successMessage);
            },
            error: () => {
              this.errorMessage = 'Profile updated, but image upload failed.';
              alert(this.errorMessage);
            }
          });

        } else {
          // No image change
          this.successMessage = 'Profile updated successfully.';

          this.refreshPage();
          this.cdr.detectChanges();

          alert(this.successMessage);
        }
      },
      error: () => {
        this.errorMessage = 'Failed to update profile.';
        alert(this.errorMessage);
      }
    });
  }

  // ================= PASSWORD =================
  changePassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (isEmpty(this.currentPassword) || isEmpty(this.newPassword) || isEmpty(this.confirmPassword)) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    if (!validatePasswordMatch(this.newPassword, this.confirmPassword)) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }                                 
        
  
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
    

    // // TEMP: simulate success
    // this.successMessage = 'Password updated (simulation).';

    // this.currentPassword = '';
    // this.newPassword = '';
    // this.confirmPassword = '';
  }

  // ================= DARK MODE =================
  toggleTheme(): void {
    toggleTheme(this.darkMode);
  }


  // ================= TABLE DENSITY =================
  toggleDensity(): void {
    toggleDensity(this.compactDensity);
  }

  // ================= LOGOUT =================
  logout() {
    logoutUser();
  }

}

