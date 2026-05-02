import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';

import { ProfileService } from '../../services/profile.service';
import { Profile } from '../../models/profile.model';
import { logoutUser } from '../../helpers/auth.helpers';
import { applySavedTheme, applySavedDensity } from '../../helpers/theme.helpers';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayoutComponent implements OnInit {
  profile: Profile | null = null;
  profileImageUrl: string | null = null;

  constructor(
    private profileService: ProfileService,
    public notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    console.log('MainLayoutComponent initialized');
    applySavedDensity();
    applySavedTheme();

    this.profileService.profile$.subscribe(profile => {
      this.profile = profile;
    });

    this.profileService.profileImage$.subscribe(imageUrl => {
      this.profileImageUrl = imageUrl;
    });

    this.profileService.getProfile().subscribe({
      error: () => {
        console.warn('Using fallback user');

        this.profile = {
          id: '1',
          email: 'john@example.com',
          userName: 'User',
          displayName: 'John Doe',
          roles: []
        };
      }
    });

    this.profileService.getProfileImage().subscribe({
      error: () => {
        this.profileImageUrl = null;
      }
    });
  }

  logout(): void {
    this.profileService.clearProfileCache();
    logoutUser();
  }
}