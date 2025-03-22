import { TestBed } from '@angular/core/testing';

import { SubRecipesService } from './sub-recipes.service';

describe('SubRecipesService', () => {
  let service: SubRecipesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubRecipesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
