import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

import { EmployeeService } from "../services/employee.service";

export interface Employee {
  name: string;
  email: string;
  role: 'Staff' | 'Admin';
}

/* const EMPLOYEE_DATA: Employee[] = [
  { name: 'Alice Johnson', email: 'alice@pharmastock.com', role: 'Administrator' },
  { name: 'Bob Smith', email: 'bob@pharmastock.com', role: 'Manager' },
  { name: 'Carol White', email: 'carol@pharmastock.com', role: 'User' }
]; */

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatButtonModule
  ],
  templateUrl: './administration.html',
  styleUrl: './administration.css'
})

export class Administration implements OnInit{

  constructor(private employeeService: EmployeeService){}

  displayedColumns: string[] = [
    'name',
    'email',
    'role',
    'save',
    'remove'
  ];

  dataSource = new MatTableDataSource<Employee>([]);

  mapRole(roles: string[]): 'Staff' | 'Admin' {
    if(!roles || roles.length ===0) return 'Staff';
    if(roles.includes('Admin')) return 'Admin';
    return 'Staff';
  }
  

  newEmployee: Employee = {
    name: '',
    email: '',
    role: 'Staff'
  };

  tempPassword = '';

  showConfirmModal = false;
  adminPasswordInput = '';

  pendingEmployeeUpdate: Employee | null = null;
  pendingEmployeeRemoval: Employee | null = null;
  pendingNewEmployee = false;

  confirmUpdate(employee: Employee) {

    this.pendingEmployeeUpdate = employee;
    this.pendingEmployeeRemoval = null;
    this.pendingNewEmployee = false;

    this.adminPasswordInput = '';
    this.showConfirmModal = true;

  }

  confirmRemove(employee: Employee) {

    this.pendingEmployeeRemoval = employee;
    this.pendingEmployeeUpdate = null;
    this.pendingNewEmployee = false;

    this.adminPasswordInput = '';
    this.showConfirmModal = true;

  }

  confirmAdd() {

    if (!this.newEmployee.name || !this.newEmployee.email || !this.tempPassword) {
      return;
    }

    this.pendingNewEmployee = true;
    this.pendingEmployeeUpdate = null;
    this.pendingEmployeeRemoval = null;

    this.adminPasswordInput = '';
    this.showConfirmModal = true;

  }

  finalizeAdminAction() {

    if (!this.adminPasswordInput) return;

    // 🔧 UPDATE (role change)
    if (this.pendingEmployeeUpdate) {

      const email = this.pendingEmployeeUpdate.email;
      const role = this.pendingEmployeeUpdate.role;

      this.employeeService.removeRole(email, 'Admin').subscribe({
        next: () => {

          if (role === 'Admin') {
            this.employeeService.assignRole(email, 'Admin').subscribe({
              next: () => this.loadEmployees(),
              error: (err) => console.error('Assign role failed', err)
            });
          } else {
            this.loadEmployees();
          }

        },
        error: (err) => {
          console.error('Remove role failed', err);
        }
      });
    }

    // 🗑 DELETE
    if (this.pendingEmployeeRemoval) {
      this.employeeService.deleteUser(this.pendingEmployeeRemoval.email)
        .subscribe({
          next: () => this.loadEmployees(),
          error: (err) => console.error('Delete failed', err)
        });
    }

    // ADD (register + assign role)
    if (this.pendingNewEmployee) {

      const payload = {
        email: this.newEmployee.email,
        password: this.tempPassword
      };

      this.employeeService.register(payload).subscribe({
        next: () => {

          
          if (this.newEmployee.role === 'Admin') {
            this.employeeService.assignRole(this.newEmployee.email, 'Admin')
              .subscribe({
                next: () => this.loadEmployees(),
                error: (err) => console.error('Assign role failed', err)
              });
          } else {
            this.loadEmployees();
          }

          // Reset form
          this.newEmployee = {
            name: '',
            email: '',
            role: 'Staff'
          };

          this.tempPassword = '';
        },
        error: (err) => {
          console.error('Register failed', err);
        }
      });
    }

    
    this.cancelAdminAction();
  }

  cancelAdminAction() {

    this.showConfirmModal = false;
    this.adminPasswordInput = '';

    this.pendingEmployeeUpdate = null;
    this.pendingEmployeeRemoval = null;
    this.pendingNewEmployee = false;

  }

  logout() {
    localStorage.clear(); // or remove specific token
    sessionStorage.clear();
    window.location.href = '/login'; // or your login route
  }

  loadEmployees() {
    this.employeeService.getAll().subscribe({
      next: (users: any[]) => {

        const mapped = users.map(u => ({
          name: u.userName,
          email: u.email,
          role: this.mapRole(u.roles)
        }));

        this.dataSource.data = mapped;
      },
      error: (err) => {
        console.error('Failed to load users', err);
      }
    });
  }

  ngOnInit() {
    this.loadEmployees();      
  }

}