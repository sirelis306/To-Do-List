import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDetailModal } from './task-detail-modal';

describe('TaskDetailModal', () => {
  let component: TaskDetailModal;
  let fixture: ComponentFixture<TaskDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDetailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskDetailModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
