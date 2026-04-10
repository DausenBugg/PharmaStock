import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from './employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private apiUrl = 'http://localhost:5177/api/Admin/users';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }

  deleteUser(email: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${email}`);
  }

  register(payload: { email: string; password: string }) {
    return this.http.post('http://localhost:5177/api/Auth/register', payload);
  }

  assignRole(email: string, role: string) {
    return this.http.post('http://localhost:5177/api/Auth/assign-role', {
      email,
      role
    });
  }

  removeRole(email: string, role: string) {
    return this.http.post('http://localhost:5177/api/Auth/remove-role', {
      email,
      role
    });
  }
}