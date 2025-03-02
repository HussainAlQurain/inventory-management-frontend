import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryItemDetailModalComponent } from './inventory-item-detail-modal.component';

describe('InventoryItemDetailModalComponent', () => {
  let component: InventoryItemDetailModalComponent;
  let fixture: ComponentFixture<InventoryItemDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryItemDetailModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryItemDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
