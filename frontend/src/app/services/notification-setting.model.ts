export interface NotificationSetting {
  expirationWarningDays: number;
  lowStockThresholdPercent: number;
  riskScoreCriticalThreshold: number;
  riskScoreWarningThreshold: number;
  minRiskScoreFilter: number;
  updatedAtUtc: string;
}
