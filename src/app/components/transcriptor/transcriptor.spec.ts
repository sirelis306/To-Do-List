import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Transcriptor } from './transcriptor';

describe('Transcriptor', () => {
  let component: Transcriptor;
  let fixture: ComponentFixture<Transcriptor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transcriptor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Transcriptor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
