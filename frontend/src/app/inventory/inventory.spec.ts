import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { InventoryComponent } from './inventory';
import { InventoryItem } from './inventory';

describe('Inventory', () => {
  let component: InventoryComponent;
  let fixture: ComponentFixture<InventoryComponent>;
  let httpMock: HttpTestingController;

  const formatDate = (date: Date): string => date.toISOString().split('T')[0];

  const createTestData = (): InventoryItem[] => {
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
        form: 'Tablet',
        strength: '25mg',
        nationalDrugCode: 'NDC-1',
        lotNumber: 'A1023',
        quantityOnHand: 100,
        expirationDate: formatDate(nearExpiration),
        reorderPoint: 25,
        binLocation: 'A1',
        beyondUseDate: formatDate(nearExpiration)
      },
      {
        inventoryStockId: 2,
        medicationId: 2,
        medicationName: 'Glucophage Metformin',
        form: 'Tablet',
        strength: '25mg',
        nationalDrugCode: 'NDC-2',
        lotNumber: 'D7722',
        quantityOnHand: 100,
        expirationDate: formatDate(farExpiration),
        reorderPoint: 25,
        binLocation: 'B2',
        beyondUseDate: formatDate(farExpiration)
      },
      {
        inventoryStockId: 3,
        medicationId: 3,
        medicationName: 'Advil',
        form: 'Tablet',
        strength: '25mg',
        nationalDrugCode: 'NDC-3',
        lotNumber: 'K9021',
        quantityOnHand: 100,
        expirationDate: formatDate(expired),
        reorderPoint: 25,
        binLocation: 'C3',
        beyondUseDate: formatDate(expired)
      }
    ];
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;

    const request = httpMock.expectOne('http://localhost:5177/api/inventorystocks');
    request.flush([]);

    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters by partial medication name on submit', () => {
    component.allItems = createTestData();
    component.clearFilters();

    component.searchName = 'formin';
    component.onSearch();

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].medicationName).toContain('Metformin');
  });

  it('filters by partial lot number (case-insensitive)', () => {
    component.allItems = createTestData();
    component.clearFilters();

    component.searchLot = 'd77';
    component.onSearch();

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].lotNumber).toBe('D7722');
  });

  it('applies medication name and lot filters together', () => {
    component.allItems = createTestData();
    component.clearFilters();

    component.searchName = 'lipi';
    component.searchLot = '1023';
    component.onSearch();

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].medicationName).toBe('Lipitor');
  });

  it('filters near-expiration medications within next 7 days and excludes expired', () => {
    component.allItems = createTestData();
    component.clearFilters();

    component.nearExpirationOnly = true;
    component.onSearch();

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].medicationName).toBe('Lipitor');
  });

  it('clears filters and restores full dataset', () => {
    component.allItems = createTestData();
    component.clearFilters();

    component.searchName = 'lipi';
    component.onSearch();
    expect(component.dataSource.length).toBe(1);

    component.clearFilters();
    expect(component.searchName).toBe('');
    expect(component.searchLot).toBe('');
    expect(component.nearExpirationOnly).toBeFalse();
    expect(component.dataSource.length).toBe(3);
  });
});
