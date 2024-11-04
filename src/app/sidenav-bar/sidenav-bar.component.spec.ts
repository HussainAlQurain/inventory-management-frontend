import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidenavBarComponent } from './sidenav-bar.component';

describe('SidenavBarComponent', () => {
  let component: SidenavBarComponent;
  let fixture: ComponentFixture<SidenavBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidenavBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidenavBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
