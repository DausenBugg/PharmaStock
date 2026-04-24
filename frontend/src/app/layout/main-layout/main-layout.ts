import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';

import { ProfileService } from '../../services/profile.service';
import { Profile } from '../../models/profile.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayoutComponent implements OnInit, AfterViewInit {

  profile: Profile | null = null;
  profileImageUrl: string | null = null;

  constructor(private profileService: ProfileService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadUserImage();
  }

  ngAfterViewInit(): void {
    this.loadUserProfile();
    this.loadUserImage();
  }
  // =========================
  // PROFILE DATA
  // =========================

  loadUserProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (data: Profile) => {
        this.profile = data;
      },
      error: () => {
        console.warn('Using fallback user');

        // fallback (optional)
        this.profile = {
          id: '1',
          email: 'john@example.com',
          userName: 'User',
          displayName: 'John Doe',
          roles: []
        };
      }
    });
  }

  loadUserImage(): void {
    this.profileService.getProfileImage().subscribe({
      next: (blob: Blob) => {
        this.profileImageUrl = URL.createObjectURL(blob);
        this.cdr.detectChanges();
      },
      error: () => {
        this.profileImageUrl = null; // fallback to placeholder
      }
    });
  }

  // =========================
  // LOGOUT
  // =========================

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('pharmastock_jwt');
    sessionStorage.clear();
    window.location.href = '/login';
  }
}