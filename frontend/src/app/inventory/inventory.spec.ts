import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { InventoryComponent } from './inventory';
import { InventoryService } from '../services/inventory.service';
import { InventoryRow } from './inventory.model';
import { PagedResponse } from '../models/Pagination.model';
import { InventoryApiItem } from '../models/inventory-api.model';

describe('InventoryComponent', () => {
  let component: InventoryComponent;
  let fixture: ComponentFixture<InventoryComponent>;
  let inventoryServiceSpy: jasmine.SpyObj<InventoryService>;

  const formatDate = (date: Date): string => date.toISOString().split('T')[0];

  const createRows = (): InventoryRow[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nearExpiration = new Date(today);
    nearExpiration.setDate(nearExpiration.getDate() + 3);

    const farExpiration = new Date(today);
    farExpiration.setDate(farExpiration.getDate() + 20);

    const expired = new Date(today);
    expired.setDate(expired.getDate() - 1);

    return [
      {
        inventoryStockId: 1,
        medicationId: 1,
        medicationName: 'Lipitor',
        genericName: null,
        form: 'Tablet',
        strength: '25mg',
        nationalDrugCode: 'NDC-1',
        lot: 'A1023',
        quantity: 100,
        reorderPoint: 25,
        binLocation: 'A1',
        expiration: formatDate(nearExpiration),
        beyondUseDate: formatDate(nearExpiration),
        packageNdc: null,
        packageDescription: null
      },
      {
        inventoryStockId: 2,
        medicationId: 2,
        medicationName: 'Glucophage Metformin',
        genericName: null,
        form: 'Tablet',
        strength: '25mg',
        nationalDrugCode: 'NDC-2',
        lot: 'D7722',
        quantity: 100,
        reorderPoint: 25,
        binLocation: 'B2',
        expiration: formatDate(farExpiration),
        beyondUseDate: formatDate(farExpiration),
        packageNdc: null,
        packageDescription: null
      },
      {
        inventoryStockId: 3,
        medicationId: 3,
        medicationName: 'Advil',
        genericName: null,
        form: 'Tablet',
        strength: '25mg',
        nationalDrugCode: 'NDC-3',
        lot: 'K9021',
        quantity: 100,
        reorderPoint: 25,
        binLocation: 'C3',
        expiration: formatDate(expired),
        beyondUseDate: formatDate(expired),
        packageNdc: null,
        packageDescription: null
      }
    ];
  };

  beforeEach(async () => {
    inventoryServiceSpy = jasmine.createSpyObj<InventoryService>('InventoryService', ['getInventoryStocks']);
    const value: Observable<PagedResponse<InventoryApiItem>> = of();
    inventoryServiceSpy.getInventoryStocks.and.returnValue(value); // default

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [{ provide: InventoryService, useValue: inventoryServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters by partial medication name on submit', () => {
    const rows = createRows();
    // Feed the component by mocking the service response
    inventoryServiceSpy.getInventoryStocks.and.returnValue(of(rows as any));
    component.loadInventory();

    component.clearFilters();
    component.searchName = 'formin';
    component.onSearch();

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].medicationName).toContain('Metformin');
  });

  it('filters by partial lot number (case-insensitive)', () => {
    const rows = createRows();
    inventoryServiceSpy.getInventoryStocks.and.returnValue(of(rows as any));
    component.loadInventory();

    component.clearFilters();
    component.searchLot = 'd77';
    component.onSearch();

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].lot).toBe('D7722');
  });

  it('applies medication name and lot filters together', () => {
    const rows = createRows();
    inventoryServiceSpy.getInventoryStocks.and.returnValue(of(rows as any));
    component.loadInventory();

    component.clearFilters();
    component.searchName = 'lipi';
    component.searchLot = '1023';
    component.onSearch();

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].medicationName).toBe('Lipitor');
  });

  it('filters near-expiration meds within next 7 days and excludes expired', () => {
    const rows = createRows();
    inventoryServiceSpy.getInventoryStocks.and.returnValue(of(rows as any));
    component.loadInventory();

    component.clearFilters();
    component.onSearch();

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].medicationName).toBe('Lipitor');
  });

  it('clears filters and restores full dataset', () => {
    const rows = createRows();
    inventoryServiceSpy.getInventoryStocks.and.returnValue(of(rows as any));
    component.loadInventory();

    component.clearFilters();
    component.searchName = 'lipi';
    component.onSearch();
    expect(component.dataSource.data.length).toBe(1);

    component.clearFilters();
    expect(component.searchName).toBe('');
    expect(component.searchLot).toBe('');
    expect(component.dataSource.data.length).toBe(3);
  });
});