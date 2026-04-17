import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';

import { ProfileService } from '../services/profile.service';
import { Profile } from '../models/profile.model';

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
  profile: Profile = {
    id: '1',
    email: 'john@example.com',
    userName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '123-456-7890',
    roles: ['Administrator']
  };

  profileImageUrl: string | null = null;
  selectedFile: File | null = null;

  // ================= PASSWORD =================
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // ================= APPEARANCE =================
  darkMode: boolean = false;
  compactDensity: boolean = false;

  // ================= UI STATE =================
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private profileService: ProfileService
  ) {
    const body = document.body;

    this.darkMode = body.classList.contains('dark-theme');
    this.compactDensity = body.classList.contains('compact-density');
  }

  // ================= INIT =================
  ngOnInit(): void {            //UNCOMMENT THIS WHEN BACKEND IS TIED IN

    //  BACKEND VERSION (enable later)
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
      },
      error: () => {
        console.warn('No profile image found');
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
  saveProfile(): void {       //UNCOMMENT WHEN BACKEND IS TIED IN

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