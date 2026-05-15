import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExpiredMedicationReportResponseDto {
    inventoryStockId: number;
    medicationId: number;
    medicationName: string;
    genericName?: string;
    nationalDrugCode: string;
    packageNdc?: string;
    packageDescription?: string;
    lotNumber: string;
    quantityOnHand: number;
    expirationDate: string; // ISO format date string
    binLocation: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private baseUrl = 'http://localhost:5177/api/reports';

  constructor(private http: HttpClient) {}

    getExpiredMedicationsReport(startDate?: string, endDate?: string): Observable<ExpiredMedicationReportResponseDto[]> {
        let params = new HttpParams();

        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);

        return this.http.get<ExpiredMedicationReportResponseDto[]>(`${this.baseUrl}/expired`, { params });
    }

    exportExpiredMedicationsToCsv(
        expired?: boolean,
        expiringSoon?: boolean,
        stockedOut?: boolean,
        lowInventory?: boolean,
        startDate?: string,
        endDate?: string
        ): Observable<Blob> {
        let params = new HttpParams();

        if (expired) params = params.set('expired', expired);
        if (expiringSoon) params = params.set('expiringSoon', expiringSoon);
        if (stockedOut) params = params.set('stockedOut', stockedOut);
        if (lowInventory) params = params.set('lowInventory', lowInventory);

        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);

        return this.http.get(`${this.baseUrl}/expired/export`, {
            params,
            responseType: 'blob'
        });
    }

}