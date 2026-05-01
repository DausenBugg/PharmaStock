import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { Reports } from './reports';
import { InventoryService } from '../services/inventory.service';
import { InventoryApiItem } from '../models/inventory-api.model';

describe('Reports', () => {
  let component: Reports;
  let fixture: ComponentFixture<Reports>;
  let inventoryServiceSpy: jasmine.SpyObj<InventoryService>;

  const inventoryItems: InventoryApiItem[] = [
    {
      inventoryStockId: 1,
      medicationId: 10,
      medicationName: 'Amoxicillin',
      genericName: 'Amoxicillin',
      form: 'Capsule',
      strength: '500 mg',
      nationalDrugCode: '11111-1111',
      quantityOnHand: 0,
      reorderLevel: 5,
      lotNumber: 'LOT-001',
      binLocation: 'A-01',
      expirationDate: null,
      beyondUseDate: null,
      packageNdc: null,
      packageDescription: null
    },
    {
      inventoryStockId: 2,
      medicationId: 11,
      medicationName: 'Ibuprofen',
      genericName: 'Ibuprofen',
      form: 'Tablet',
      strength: '200 mg',
      nationalDrugCode: '22222-2222',
      quantityOnHand: 20,
      reorderLevel: 10,
      lotNumber: 'LOT-002',
      binLocation: 'B-01',
      expirationDate: '2099-12-31T00:00:00Z',
      beyondUseDate: null,
      packageNdc: 'PKG-200',
      packageDescription: 'Bottle'
    }
  ];

  beforeEach(async () => {
    inventoryServiceSpy = jasmine.createSpyObj<InventoryService>('InventoryService', ['getAllInventoryStocks']);
    inventoryServiceSpy.getAllInventoryStocks.and.returnValue(of(inventoryItems));

    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [
        { provide: InventoryService, useValue: inventoryServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null
              }
            }
          }
        },
        {
          provide: MatDialog,
          useValue: {
            open: jasmine.createSpy('open')
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Reports);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the full report inventory through the all-pages service helper', () => {
    expect(inventoryServiceSpy.getAllInventoryStocks).toHaveBeenCalled();
    expect(component.totalInventoryCount).toBe(2);
    expect(component.summary.visible).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('keeps stocked out items without expiration dates when the stocked out filter is active', () => {
    component.filterStockedOut = true;

    component.applyFilters();

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].inventoryStockId).toBe(1);
    expect(component.summary.stockedOut).toBe(1);
  });

  it('searches by lot and NDC values in addition to medication names', () => {
    component.searchValue = 'lot-002';

    component.applyFilters();

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].inventoryStockId).toBe(2);
  });
});
