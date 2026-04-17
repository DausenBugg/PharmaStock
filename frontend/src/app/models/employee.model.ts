export interface Employee {
  id: string;              // usually string if coming from Identity
  email: string;
  userName: string;
  emailConfirmed: boolean;
  roles: string[];

  // fallback fields (if needed for UI display)
  [key: string]: string | boolean | string[];
}