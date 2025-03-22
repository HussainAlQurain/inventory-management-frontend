import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubRecipeDetailComponent } from './sub-recipe-detail.component';

describe('SubRecipeDetailComponent', () => {
  let component: SubRecipeDetailComponent;
  let fixture: ComponentFixture<SubRecipeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubRecipeDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubRecipeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
