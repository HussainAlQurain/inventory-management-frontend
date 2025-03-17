import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceHistoryDialogComponent } from './price-history-dialog.component';

describe('PriceHistoryDialogComponent', () => {
  let component: PriceHistoryDialogComponent;
  let fixture: ComponentFixture<PriceHistoryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceHistoryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceHistoryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
