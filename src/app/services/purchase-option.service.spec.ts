import { TestBed } from '@angular/core/testing';

import { PurchaseOptionService } from './purchase-option.service';

describe('PurchaseOptionService', () => {
  let service: PurchaseOptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PurchaseOptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
