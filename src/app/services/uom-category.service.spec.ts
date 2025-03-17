import { TestBed } from '@angular/core/testing';

import { UomCategoryService } from './uom-category.service';

describe('UomCategoryService', () => {
  let service: UomCategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UomCategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
