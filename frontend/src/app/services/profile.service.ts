import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';
import { Profile } from '../models/profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:5177/api/Profile';

  private profileSubject = new BehaviorSubject<Profile | null>(null);
  profile$ = this.profileSubject.asObservable();

  private profileImageSubject = new BehaviorSubject<string | null>(null);
  profileImage$ = this.profileImageSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) return new HttpHeaders();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getProfile(forceRefresh: boolean = false): Observable<Profile> {
    const cachedProfile = this.profileSubject.value;

    if (cachedProfile && !forceRefresh) {
      return of(cachedProfile);
    }

    return this.http.get<Profile>(`${this.apiUrl}/me`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(profile => this.profileSubject.next(profile))
    );
  }

  refreshProfile(): Observable<Profile> {
    return this.getProfile(true);
  }

  updateProfile(profile: Profile): Observable<Profile> {
    return this.http.patch<Profile>(`${this.apiUrl}/update-profile`, profile, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(updatedProfile => this.profileSubject.next(updatedProfile))
    );
  }

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/update-password`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  getProfileImage(forceRefresh: boolean = false): Observable<string | null> {
    const cachedImage = this.profileImageSubject.value;

    if (cachedImage && !forceRefresh) {
      return of(cachedImage);
    }

    return this.http.get(`${this.apiUrl}/profile-image`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    }).pipe(
      map(blob => URL.createObjectURL(blob)),
      tap(imageUrl => this.profileImageSubject.next(imageUrl))
    );
  }

  updateProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('File', file, file.name);

    return this.http.patch(`${this.apiUrl}/profile-image`, formData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.refreshProfile().subscribe())
    );
  }
  
  clearProfileCache(): void {
    this.profileSubject.next(null);

    const imageUrl = this.profileImageSubject.value;
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    this.profileImageSubject.next(null);
  }
}