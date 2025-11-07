import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryAutocomplete } from './category-autocomplete';

describe('CategoryAutocomplete', () => {
  let component: CategoryAutocomplete;
  let fixture: ComponentFixture<CategoryAutocomplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryAutocomplete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryAutocomplete);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
