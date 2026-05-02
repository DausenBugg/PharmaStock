export interface EmployeeApi {
  id: string;
  email: string;
  userName: string;
  emailConfirmed: boolean;
  roles: string[];
  displayName?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'Staff' | 'Admin';
  originalRole?: 'Staff' | 'Admin';
  originalName?: string;
}