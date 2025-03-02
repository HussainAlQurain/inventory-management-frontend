import { TestBed } from '@angular/core/testing';

import { InventoryItemsServiceService } from './inventory-items-service.service';

describe('InventoryItemsServiceService', () => {
  let service: InventoryItemsServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InventoryItemsServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
