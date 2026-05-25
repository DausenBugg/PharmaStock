import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { CreateInventoryStockRequest, InventoryApiItem, UpdateInventoryStockPatchRequest, UpdateMedicationPatchRequest } from '../models/inventory-api.model';
import { PagedResponse, PaginationRequest } from '../models/Pagination.model';
import { CreateMedicationRequest, MedicationResponse } from '../models/medication-create.model';


@Injectable({
    providedIn: 'root'
    })
    export class InventoryService {
        private baseUrl = 'http://localhost:5177/api';

        constructor(private http: HttpClient) { }


        getInventoryStocks(params: PaginationRequest): Observable<PagedResponse<InventoryApiItem>> {

            let httpParams: any = {
                pageNumber: params.pageNumber,
                pageSize: params.pageSize
            };

            if (params.name) httpParams.name = params.name;
            if (params.lot) httpParams.lot = params.lot;

            if (params.search) httpParams.search = params.search;
            if (params.expired !== undefined) httpParams.expired = params.expired;
            if (params.expiringSoon !== undefined) httpParams.expiringSoon = params.expiringSoon;
            if (params.stockedOut !== undefined) httpParams.stockedOut = params.stockedOut;
            if (params.lowInventory !== undefined) httpParams.lowInventory = params.lowInventory;

            return this.http.get<PagedResponse<InventoryApiItem>>(
                `${this.baseUrl}/InventoryStocks/list`,
                { params: httpParams }
            );
        }

        getAllInventoryStocks(pageSize = 250): Observable<InventoryApiItem[]> {

            return this.getInventoryStocks({ pageNumber: 1, pageSize }).pipe(
                expand((response, index) => {

                const nextPage = index + 2; // 👈 THIS is the key

                console.log('FETCHING PAGE:', nextPage, 'OF', response.totalPages);

                if (nextPage > response.totalPages) {
                    return EMPTY;
                }

                return this.getInventoryStocks({
                    pageNumber: nextPage,
                    pageSize
                });
                }),
                map(res => res.items ?? []),
                reduce((all, items) => all.concat(items), [] as InventoryApiItem[])
            );
        }

        adjustQuantity(inventoryStockId: number, adjustment: number): Observable<InventoryApiItem> {
            return this.http.patch<InventoryApiItem>(
                `${this.baseUrl}/InventoryStocks/${inventoryStockId}/adjust`,
                { adjustment }
            );
        }

        createInventoryStocks(request: CreateInventoryStockRequest ): Observable<InventoryApiItem> {
            return this.http.post<InventoryApiItem>(
                `${this.baseUrl}/InventoryStocks`,
                request
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
        patchNationalDrugCodeOverride(inventoryStockId: number, nationalDrugCodeOverride: string | null) {
            return this.http.patch(
                `${this.baseUrl}/InventoryStocks/${inventoryStockId}/update-ndc-override`,
                { nationalDrugCodeOverride }
            );
        }

        createMedication(request: CreateMedicationRequest): Observable<MedicationResponse> {
            return this.http.post<MedicationResponse>(
                `${this.baseUrl}/Medications`,
                request
            );
        }
        getInventorySummary(): Observable<{
            totalItems: number;
            expired: number;
            expiringSoon: number;
            stockedOut: number;
            lowInventory: number;
        }> {
            return this.http.get<any>(`${this.baseUrl}/InventoryStocks/summary`);
        }
}