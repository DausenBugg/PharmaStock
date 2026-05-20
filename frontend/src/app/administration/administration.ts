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
import { logoutUser } from "../helpers/auth.helpers";
import { mapRole } from '../helpers/role.helpers';
import { NotificationService } from '../services/notification.service';


export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'Staff' | 'Admin';
  originalRole: 'Staff' | 'Admin';
  originalName: string;
}

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

  constructor(private employeeService: EmployeeService,
              public notificationService: NotificationService
  ){}

  displayedColumns: string[] = [
    'name',
    'email',
    'role',
    'save',
    'remove'
  ];

  dataSource = new MatTableDataSource<Employee>([]);

  // Role options for dropdown
  roleOptions: ['Staff', 'Admin'] = ['Staff', 'Admin'];

  newEmployee: Employee = {
    
    id: '',
    name: '',
    email: '',
    role: 'Staff',
    originalRole: 'Staff',
    originalName: ''
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

    // UPDATE employee name/role
    if (this.pendingEmployeeUpdate) {
      const email = this.pendingEmployeeUpdate.email;
      const newRole = this.pendingEmployeeUpdate.role;
      const displayName = this.pendingEmployeeUpdate.name;
      const id = this.pendingEmployeeUpdate.id;
      const originalRole = this.pendingEmployeeUpdate.originalRole;
      const originalName = this.pendingEmployeeUpdate.originalName;

      this.employeeService.updateDisplayName(id, displayName).subscribe({
        next: () => {
          this.employeeService.getRoles(email).subscribe({
            next: (roles: string[]) => {
             
              const isCurrentlyAdmin = roles.some(r => r.toLowerCase() === 'admin');
              const isCurrentlyStaff = roles.some(r => r.toLowerCase() === 'staff');

              //get the current role to check against the new role to see if we need to change on save 
              const currentRole: 'Staff' | 'Admin' = isCurrentlyAdmin ? 'Admin' : 'Staff';

              const roleChanged = newRole !== currentRole;
              const nameChanged = displayName !== originalName;

              // Name change only
              if (!roleChanged && nameChanged) {
                this.notificationService.show('Employee name updated successfully.', 'success');
                this.loadEmployees();
                this.cancelAdminAction();
                return;
              }
              // Nothing changed
              if (!roleChanged && !nameChanged) {
                this.notificationService.show('No changes made.', 'error');
                this.cancelAdminAction();
                return;
              }

              if (newRole === 'Admin') {
                this.employeeService.assignRole(email, 'Admin').subscribe({
                  next: () => {
                    if (isCurrentlyStaff) {
                      this.employeeService.removeRole(email, 'Staff').subscribe({
                        next: () => {
                          this.notificationService.show('Employee updated to Admin.', 'success');
                          this.loadEmployees();
                          this.cancelAdminAction();
                        },
                        error: (err) => {
                          console.error('Remove Staff role failed', err);
                          this.notificationService.show('Role updated, but failed to remove Staff.', 'error');
                        }
                      });
                    } else {
                      this.notificationService.show('Employee updated to Admin.', 'success');
                      this.loadEmployees();
                      this.cancelAdminAction();
                    }
                  },
                  error: (err) => {
                    console.error('Assign Admin role failed', err);
                    this.notificationService.show('Failed to update employee role.', 'error');
                  }
                });
              }

              if (newRole === 'Staff') {
                this.employeeService.assignRole(email, 'Staff').subscribe({
                  next: () => {
                    if (isCurrentlyAdmin) {
                      this.employeeService.removeRole(email, 'Admin').subscribe({
                        next: () => {
                          this.notificationService.show('Employee updated to Staff.', 'success');
                          this.loadEmployees();
                          this.cancelAdminAction();
                        },
                        error: (err) => {
                          console.error('Remove Admin role failed', err);
                          this.notificationService.show('Role updated, but failed to remove Admin.', 'error');
                        }
                      });
                    } else {
                      this.notificationService.show('Employee updated to Staff.', 'success');
                      this.loadEmployees();
                      this.cancelAdminAction();
                    }
                  },
                  error: (err) => {
                    console.error('Assign Staff role failed', err);
                    this.notificationService.show('Failed to update employee role.', 'error');
                  }
                });
              }
            },
            error: (err) => {
              console.error('Failed to fetch roles', err);
              this.notificationService.show('Failed to check current role.', 'error');
            }
          });
        },
        error: (err) => {
          console.error('Display name update failed', err);
          this.notificationService.show('Failed to update employee name.', 'error');
        }
      });

      return;
    }

    // DELETE employee
    if (this.pendingEmployeeRemoval) {
      this.employeeService.deleteUser(this.pendingEmployeeRemoval.email)
        .subscribe({
          next: () => {
            this.notificationService.show('Employee removed successfully.', 'success');
            this.loadEmployees();
            this.cancelAdminAction();
          },
          error: (err) => {
            console.error('Delete failed', err);
            this.notificationService.show('Failed to remove employee.', 'error');
          }
        });

      return;
    }

    // ADD employee
    if (this.pendingNewEmployee) {
      const payload = {
        email: this.newEmployee.email,
        password: this.tempPassword,
        confirmPassword: this.tempPassword
      };

      const selectedRole = this.newEmployee.role;

      this.employeeService.register(payload).subscribe({
        next: (createdUser: any) => {
          const userId = createdUser.id;

          this.employeeService.assignRole(this.newEmployee.email, selectedRole)
            .subscribe({
              next: () => {
                this.employeeService.updateDisplayName(
                  userId,
                  this.newEmployee.name
                ).subscribe({
                  next: () => {
                    this.notificationService.show('Employee added successfully.', 'success');
                    this.loadEmployees();
                    this.cancelAdminAction();

                    this.newEmployee = {
                      id: '',
                      name: '',
                      email: '',
                      role: 'Staff',
                      originalRole: 'Staff',
                      originalName: ''
                    };

                    this.tempPassword = '';
                  },
                  error: (err) => {
                    console.error('Display name update failed', err);
                    this.notificationService.show('Employee created, but name update failed.', 'error');
                    this.loadEmployees();
                    this.cancelAdminAction();
                  }
                });
              },
              error: (err) => {
                console.error('Assign role failed', err);
                this.notificationService.show('Employee created, but role assignment failed.', 'error');
              }
            });
        },
        error: (err) => {
          console.error('Register failed', err);
          this.notificationService.show('Failed to add employee.', 'error');
        }
      });

      return;
    }
  }

  cancelAdminAction() {

    this.showConfirmModal = false;
    this.adminPasswordInput = '';

    this.pendingEmployeeUpdate = null;
    this.pendingEmployeeRemoval = null;
    this.pendingNewEmployee = false;

  }

  loadEmployees() {
    this.employeeService.getAll().subscribe({
      next: (users: any[]) => {

        const mapped = users.map(u => ({
          id: u.id,
          name: u.displayName ?? u.userName,
          email: u.email,
          role: mapRole(u.roles),
          originalRole: mapRole(u.roles),
          originalName: u.displayName
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