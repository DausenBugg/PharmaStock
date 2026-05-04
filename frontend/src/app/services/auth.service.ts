import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5177/api/Auth';
  private tokenKey = 'pharmastock_jwt';
  private rolesKey = 'pharmastock_roles';

  constructor(private http: HttpClient) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.rolesKey, JSON.stringify(response.roles || []));
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRoles(): string[] {
    const roles = JSON.parse(localStorage.getItem(this.rolesKey) || '[]');
    
    if(!roles || roles.length === 0) {
      return ["Staff"];
    }
    return roles;
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole("Admin");
  }

  isStaff(): boolean {
    return this.hasRole("Staff");
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.rolesKey);
    
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
    
}