export function logoutUser(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('pharmastock_jwt');
  sessionStorage.clear();
  window.location.href = '/login';
}