export interface Profile {
  id: string;
  email: string;
  userName: string;
  emailConfirmed?: boolean;
  roles?: string[];
  displayName: string;
  bio?: string;
  hasProfileImage?: boolean;
}