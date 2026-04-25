export interface UsageHistoryEntry {
  usageHistoryId: number;
  medicationName: string;
  lotNumber: string;
  quantityChanged: number;
  changeType: string;
  occurredAtUtc: string;
}
