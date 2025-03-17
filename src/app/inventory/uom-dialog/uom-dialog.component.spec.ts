import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UomDialogComponent } from './uom-dialog.component';

describe('UomDialogComponent', () => {
  let component: UomDialogComponent;
  let fixture: ComponentFixture<UomDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UomDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UomDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
