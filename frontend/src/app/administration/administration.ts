import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

export interface Employee {
  name: string;
  email: string;
  role: 'User' | 'Manager' | 'Administrator';
}

const EMPLOYEE_DATA: Employee[] = [
  { name: 'Alice Johnson', email: 'alice@pharmastock.com', role: 'Administrator' },
  { name: 'Bob Smith', email: 'bob@pharmastock.com', role: 'Manager' },
  { name: 'Carol White', email: 'carol@pharmastock.com', role: 'User' }
];

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
export class Administration {

  displayedColumns: string[] = [
    'name',
    'email',
    'role',
    'save',
    'remove'
  ];

  dataSource = new MatTableDataSource<Employee>(EMPLOYEE_DATA);

  newEmployee: Employee = {
    name: '',
    email: '',
    role: 'User'
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

    if (this.pendingEmployeeUpdate) {
      console.log('Employee updated:', this.pendingEmployeeUpdate);
    }

    if (this.pendingEmployeeRemoval) {

      this.dataSource.data = this.dataSource.data.filter(
        emp => emp !== this.pendingEmployeeRemoval
      );

    }

    if (this.pendingNewEmployee) {

      this.dataSource.data = [
        ...this.dataSource.data,
        { ...this.newEmployee }
      ];

      this.newEmployee = {
        name: '',
        email: '',
        role: 'User'
      };

      this.tempPassword = '';

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

}