export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim() === '';
}

export function validatePasswordMatch(password: string, confirm: string): boolean {
  return password === confirm;
}