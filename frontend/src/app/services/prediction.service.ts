import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReorderAlert {
  medicationId: number;
  recommendedReorderLevel: number;
  confidence: number;
  isPopular: boolean;
}

export interface ExpirationRisk {
  inventoryStockId: number;
  riskScore: number;
  riskLabel: string;
  daysToExpiry: number;
  estimatedDaysToDeplete: number;
}

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private readonly baseUrl = 'http://localhost:5177/api/predictions';

  constructor(private readonly http: HttpClient) {}

  getReorderAlerts(): Observable<ReorderAlert[]> {
    return this.http.get<ReorderAlert[]>(`${this.baseUrl}/reorder-alerts`);
  }

  getExpirationRisks(): Observable<ExpirationRisk[]> {
    return this.http.get<ExpirationRisk[]>(`${this.baseUrl}/expiration-risks`);
  }
}
