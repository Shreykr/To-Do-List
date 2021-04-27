import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollabHomeComponent } from './collab-home.component';

describe('CollabHomeComponent', () => {
  let component: CollabHomeComponent;
  let fixture: ComponentFixture<CollabHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CollabHomeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CollabHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
