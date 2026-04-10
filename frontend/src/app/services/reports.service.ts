import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExpiredMedicationReportRequestDto {
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

    getExpiredMedicationsReport(startDate?: string, endDate?: string): Observable<ExpiredMedicationReportRequestDto[]> {
        let params = new HttpParams();

        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);

        return this.http.get<ExpiredMedicationReportRequestDto[]>(`${this.baseUrl}/expired`, { params });
    }

    exportExpiredMedicationsToCsv(startDate?: string, endDate?: string): Observable<Blob> {
        let params = new HttpParams();
    

        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);

        return this.http.get(`${this.baseUrl}/expired/export`, { params, responseType: 'blob' });
 
    }

}