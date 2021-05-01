import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollabViewTaskComponent } from './collab-view-task.component';

describe('CollabViewTaskComponent', () => {
  let component: CollabViewTaskComponent;
  let fixture: ComponentFixture<CollabViewTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CollabViewTaskComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CollabViewTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
