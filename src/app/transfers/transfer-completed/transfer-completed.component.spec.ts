import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferCompletedComponent } from './transfer-completed.component';

describe('TransferCompletedComponent', () => {
  let component: TransferCompletedComponent;
  let fixture: ComponentFixture<TransferCompletedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferCompletedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransferCompletedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
