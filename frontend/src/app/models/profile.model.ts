export interface Profile {
  id: string;
  email: string;
  userName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roles?: string[]; // VERY likely included
}