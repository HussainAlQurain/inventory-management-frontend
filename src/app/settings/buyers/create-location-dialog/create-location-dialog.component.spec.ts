import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateLocationDialogComponent } from './create-location-dialog.component';

describe('CreateLocationDialogComponent', () => {
  let component: CreateLocationDialogComponent;
  let fixture: ComponentFixture<CreateLocationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateLocationDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateLocationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
