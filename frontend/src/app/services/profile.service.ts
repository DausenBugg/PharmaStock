import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Profile } from '../models/profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private apiUrl = 'http://localhost:5177/api/Profile';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) return new HttpHeaders();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}/me`, {
      headers: this.getAuthHeaders()
    });
  }

  updateProfile(profile: Profile): Observable<any> {
    return this.http.put(`${this.apiUrl}/me`, profile, {
      headers: this.getAuthHeaders()
    });
  }

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  getProfileImage(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/profile-image`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  updateProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.patch(`${this.apiUrl}/profile-image`, formData, {
      headers: this.getAuthHeaders()
    });
  }
}