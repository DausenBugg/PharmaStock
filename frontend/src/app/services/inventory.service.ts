import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryApiItem, UpdateInventoryStockPatchRequest, UpdateMedicationPatchRequest } from './inventory-api.model';
import { PagedResponse, PaginationRequest } from '../models/Pagination.model';


@Injectable({
    providedIn: 'root'
    })
    export class InventoryService {
        private baseUrl = 'http://localhost:5177/api';

        constructor(private http: HttpClient) { }


        getInventoryStocks(params: PaginationRequest): Observable<PagedResponse<InventoryApiItem>> {
            return this.http.get<PagedResponse<InventoryApiItem>>
                (`${this.baseUrl}/InventoryStocks/list`,
                {
                    params: {
                        pageNumber: params.pageNumber,
                        pageSize: params.pageSize
                    }
                }
            );
        }

        adjustQuantity(inventoryStockId: number, adjustment: number): Observable<InventoryApiItem> {
            return this.http.patch<InventoryApiItem>(
                `${this.baseUrl}/InventoryStocks/${inventoryStockId}/adjust`,
                { adjustment }
            );
        }

        createInventoryStocks(Item: InventoryApiItem ): Observable<InventoryApiItem> {
            return this.http.post<InventoryApiItem>(
                `${this.baseUrl}/InventoryStocks`,
                Item

            );
        }

        patchMedication(
        medicationId: number,
        patch: UpdateMedicationPatchRequest
        ): Observable<any> {
            return this.http.patch(
                `${this.baseUrl}/Medications/${medicationId}`,
                patch
            );
        }

        patchExpirationDate(id: number, expirationDate: string | null) {
            return this.http.patch(
                `${this.baseUrl}/InventoryStocks/${id}/update-expiration-date`,
                { expirationDate }
            );
        }

        patchBeyondUseDate(id: number, beyondUseDate: string | null) {
            return this.http.patch(
                `${this.baseUrl}/InventoryStocks/${id}/update-beyond-use-date`,
                { beyondUseDate }
            );
        }

        patchPackageNdc(id: number, packageNdc: string | null) {
            return this.http.patch(
                `${this.baseUrl}/InventoryStocks/${id}/update-package-ndc`,
                { packageNdc }
            );
        }

        patchPackageDescription(id: number, packageDescription: string | null) {
            return this.http.patch(
                `${this.baseUrl}/InventoryStocks/${id}/update-package-description`,
                { packageDescription }
            );
        }

        // New method to patch medication name override
        patchMedicationNameOverride(inventoryStockId: number, medicationNameOverride: string | null) {
            return this.http.patch(
                `${this.baseUrl}/InventoryStocks/${inventoryStockId}/update-medication-name-override`,
                { medicationNameOverride }
            );
        }

        // New method to patch medication generic name override
        patchGenericNameOverride(inventoryStockId: number, genericNameOverride: string | null) {
            return this.http.patch(
                `${this.baseUrl}/InventoryStocks/${inventoryStockId}/update-generic-name-override`,
                { genericNameOverride }
            );
        }

        // New method to patch medication form override
        patchDosageFormOverride(inventoryStockId: number, dosageFormOverride: string | null) {
            return this.http.patch(
                `${this.baseUrl}/InventoryStocks/${inventoryStockId}/update-dosage-form-override`,
                { dosageFormOverride }
            );
        }   

        // New method to patch medication strength override
        patchStrengthOverride(inventoryStockId: number, strengthOverride: string | null) {
            return this.http.patch(
                `${this.baseUrl}/InventoryStocks/${inventoryStockId}/update-strength-override`,
                { strengthOverride }
            );
        }


        // New method to patch medication national drug code override
        patchNationalDrugCodeOverride(inventoryStockId: number, nationalDrugCode: string | null) {
            return this.http.patch(
                `${this.baseUrl}/InventoryStocks/${inventoryStockId}/update-ndc-override`,
                { nationalDrugCode }
            );
        }

        
}