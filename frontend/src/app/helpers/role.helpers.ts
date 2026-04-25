export function mapRole(roles: string[]): 'Admin' | 'Staff' {
  if (!roles || roles.length === 0) return 'Staff';
  if (roles.includes('Admin')) return 'Admin';
  return 'Staff';
}

export function isAdminRole(roles: string[] | string): boolean {
  if (Array.isArray(roles)) {
    return roles.includes('Admin');
  }
  return roles === 'Admin';
}