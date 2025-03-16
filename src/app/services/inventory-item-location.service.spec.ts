import { TestBed } from '@angular/core/testing';

import { InventoryItemLocationService } from './inventory-item-location.service';

describe('InventoryItemLocationService', () => {
  let service: InventoryItemLocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InventoryItemLocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
