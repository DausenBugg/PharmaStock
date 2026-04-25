export function calculateDateDiffInDays(date: string): number {
  const today = new Date();
  const target = new Date(date);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
}

export function isExpired(date: string): boolean {
  return calculateDateDiffInDays(date) < 0;
}

export function isExpiringSoon(date: string, days: number = 30): boolean {
  const diff = calculateDateDiffInDays(date);
  return diff >= 0 && diff <= days;
}

export function getExpirationClass(date: string): string {
  const diff = calculateDateDiffInDays(date);

  if (diff < 0) return 'health-critical';
  if (diff <= 30) return 'health-warning';

  return '';
}

export function getReorderClass(quantity: number, reorderPoint: number): string {
  if (quantity < reorderPoint) return 'health-critical';
  if (quantity === reorderPoint) return 'health-warning';
  return '';
}