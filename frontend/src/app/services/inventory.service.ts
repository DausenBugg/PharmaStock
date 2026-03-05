import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryApiItem } from './inventory-api.model';



@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private baseUrl = 'http://localhost:5177/api';

    constructor(private http: HttpClient) { }

    getInventoryStocks(): Observable<InventoryApiItem[]> {
        return this.http.get<InventoryApiItem[]>(`${this.baseUrl}/InventoryStocks`);
    }

    adjustQuantity(inventoryStockId: number, adjustment: number): Observable<InventoryApiItem> {
        return this.http.put<InventoryApiItem>(
            `${this.baseUrl}/InventoryStocks/${inventoryStockId}/adjust`,
             { adjustment }
        );
    }
}