import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';

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
export class Settings {

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

  constructor(private cdr: ChangeDetectorRef) {
  const body = document.body;

  this.darkMode = body.classList.contains('dark-theme');
  this.compactDensity = body.classList.contains('compact-density');
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
}